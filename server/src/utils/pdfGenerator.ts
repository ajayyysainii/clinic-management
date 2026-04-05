import puppeteer, { Browser, Page, PaperFormat } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from './s3Client';

export class PDFGenerator {
  private static browserInstance: Browser | null = null;
  private static isInitializing = false;

  private static async getBrowser(): Promise<Browser> {
    if (this.browserInstance) {
      return this.browserInstance;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.browserInstance!;
    }

    this.isInitializing = true;
    try {
      console.log('Launching optimized Puppeteer browser...');
      this.browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-javascript',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--memory-pressure-off',
          '--max_old_space_size=4096',
        ],
      });

      // Set up browser cleanup on process exit
      process.on('exit', () => {
        if (this.browserInstance) {
          this.browserInstance.close();
        }
      });

      return this.browserInstance;
    } finally {
      this.isInitializing = false;
    }
  }

  static async generatePDF(
    htmlContent: string,
    fileName: string,
    options: {
      format?: PaperFormat;
      margin?: { top?: string; right?: string; bottom?: string; left?: string };
      headerTemplate?: string;
      footerTemplate?: string;
    } = {}
  ): Promise<string> {
    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Optimize page settings
      await page.setViewport({ width: 1200, height: 800 });

      // Enable images for logos while optimizing other resources
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        // Allow images (needed for logos), but block other heavy resources for optimization
        if (['stylesheet', 'font', 'media', 'websocket', 'manifest'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Set content and wait for images to load
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0', // Wait for network to be idle (images loaded)
        timeout: 30000,
      });

      // Additional wait to ensure images are fully rendered
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF with optimized settings
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: options.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: !!options.headerTemplate || !!options.footerTemplate,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        preferCSSPageSize: true,
        timeout: 30000,
      });

      // Upload to S3
      const s3Url = await this.uploadToS3(Buffer.from(pdfBuffer), fileName);

      return s3Url;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (closeErr) {
          console.error('Error closing page:', closeErr);
        }
      }
    }
  }

  private static async uploadToS3(buffer: Buffer, fileName: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `pdfs/${fileName}`,
      Body: buffer,
      ContentType: 'application/pdf',
    });

    await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/pdfs/${fileName}`;
  }

  static async cleanup(): Promise<void> {
    if (this.browserInstance) {
      await this.browserInstance.close();
      this.browserInstance = null;
    }
  }
}
