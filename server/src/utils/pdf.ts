import puppeteer from 'puppeteer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from './s3Client';

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return Buffer.from(pdfBuffer);
}

export async function uploadPdfToS3(buffer: Buffer, fileName: string, folder: string = 'pdfs'): Promise<string> {
  const key = `${folder}/${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
  });
  await s3Client.send(command);
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
