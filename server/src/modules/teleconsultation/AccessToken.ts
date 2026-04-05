import * as crypto from 'crypto';
import * as zlib from 'zlib';

const VERSION_LENGTH = 3;
const APP_ID_LENGTH = 32;

const getVersion = (): string => {
    return '007';
}

class Service {
    private __type: number;
    private __privileges: { [key: number]: number };

    constructor(service_type: any) {
        this.__type = service_type;
        this.__privileges = {};
    }

    private __pack_type(): Buffer {
        const buf = new ByteBuf();
        buf.putUint16(this.__type);
        return buf.pack();
    }

    private __pack_privileges(): Buffer {
        const buf = new ByteBuf();
        buf.putTreeMapUInt32(this.__privileges);
        return buf.pack();
    }

    service_type(): number {
        return this.__type;
    }

    add_privilege(privilege: any, expire: any): void {
        this.__privileges[privilege] = expire;
    }

    pack(): Buffer {
        return Buffer.concat([this.__pack_type(), this.__pack_privileges()]);
    }

    unpack(buffer: Buffer): ReadByteBuf {
        const bufReader = new ReadByteBuf(buffer);
        this.__privileges = bufReader.getTreeMapUInt32();
        return bufReader;
    }
}

const kRtcServiceType = 1;

class ServiceRtc extends Service {
    private __channel_name: string;
    private __uid: string;

    static kPrivilegeJoinChannel = 1;
    static kPrivilegePublishAudioStream = 2;
    static kPrivilegePublishVideoStream = 3;
    static kPrivilegePublishDataStream = 4;

    constructor(channel_name: any, uid: any) {
        super(kRtcServiceType);
        this.__channel_name = channel_name;
        this.__uid = uid === 0 ? '' : `${uid}`;
    }

    pack(): Buffer {
        const buffer = new ByteBuf();
        buffer.putString(this.__channel_name).putString(this.__uid);
        return Buffer.concat([super.pack(), buffer.pack()]);
    }

    unpack(buffer: Buffer): ReadByteBuf {
        const bufReader = super.unpack(buffer);
        this.__channel_name = bufReader.getString();
        this.__uid = bufReader.getString();
        return bufReader;
    }
}

const kRtmServiceType = 2;

class ServiceRtm extends Service {
    private __user_id: string;
    static kPrivilegeLogin = 1;

    constructor(user_id: string) {
        super(kRtmServiceType);
        this.__user_id = user_id || '';
    }

    pack(): Buffer {
        const buffer = new ByteBuf();
        buffer.putString(this.__user_id);
        return Buffer.concat([super.pack(), buffer.pack()]);
    }

    unpack(buffer: Buffer): ReadByteBuf {
        const bufReader = super.unpack(buffer);
        this.__user_id = bufReader.getString();
        return bufReader;
    }
}

const kFpaServiceType = 4;

class ServiceFpa extends Service {
    static kPrivilegeLogin = 1;

    constructor() {
        super(kFpaServiceType);
    }

    pack(): Buffer {
        return super.pack();
    }

    unpack(buffer: Buffer): ReadByteBuf {
        const bufReader = super.unpack(buffer);
        return bufReader;
    }
}

const kChatServiceType = 5;

class ServiceChat extends Service {
    private __user_id: string;
    static kPrivilegeUser = 1;
    static kPrivilegeApp = 2;

    constructor(user_id: string) {
        super(kChatServiceType);
        this.__user_id = user_id || '';
    }

    pack(): Buffer {
        const buffer = new ByteBuf();
        buffer.putString(this.__user_id);
        return Buffer.concat([super.pack(), buffer.pack()]);
    }

    unpack(buffer: Buffer): ReadByteBuf {
        const bufReader = super.unpack(buffer);
        this.__user_id = bufReader.getString();
        return bufReader;
    }
}

const kApaasServiceType = 7;

class ServiceApaas extends Service {
    private __room_uuid: string;
    private __user_uuid: string;
    private __role: number;
    static PRIVILEGE_ROOM_USER = 1;
    static PRIVILEGE_USER = 2;
    static PRIVILEGE_APP = 3;

    constructor(roomUuid: string, userUuid: string, role: number) {
        super(kApaasServiceType);
        this.__room_uuid = roomUuid || '';
        this.__user_uuid = userUuid || '';
        this.__role = role || -1;
    }

    pack(): Buffer {
        const buffer = new ByteBuf();
        buffer.putString(this.__room_uuid)
            .putString(this.__user_uuid)
            .putInt16(this.__role);
        return Buffer.concat([super.pack(), buffer.pack()]);
    }

    unpack(buffer: Buffer): ReadByteBuf {
        const bufReader = super.unpack(buffer);
        this.__room_uuid = bufReader.getString();
        this.__user_uuid = bufReader.getString();
        this.__role = bufReader.getInt16();
        return bufReader;
    }
}

class AccessToken {
    private appId: string;
    private appCertificate: string;
    private issueTs: number;
    private expire: number;
    private salt: number;
    private services: { [key: number]: Service };
    static kServices: any;

    constructor(appId: string, appCertificate: string, issueTs: number, expire: number) {
        this.appId = appId;
        this.appCertificate = appCertificate;
        this.issueTs = issueTs || Math.floor(Date.now() / 1000);
        this.expire = expire;
        this.salt = Math.floor(Math.random() * 99999999) + 1;
        this.services = {};
    }

    private __signing(): Buffer {
        let signing = encodeHMac(new ByteBuf().putUint32(this.issueTs).pack(), this.appCertificate);
        signing = encodeHMac(new ByteBuf().putUint32(this.salt).pack(), signing);
        return signing;
    }

    private __build_check(): boolean {
        const is_uuid = (data: string): boolean => {
            if (data.length !== APP_ID_LENGTH) {
                return false;
            }
            const buf = Buffer.from(data, 'hex');
            return !!buf;
        };

        const { appId, appCertificate, services } = this;
        if (!is_uuid(appId) || !is_uuid(appCertificate)) {
            return false;
        }

        if (Object.keys(services).length === 0) {
            return false;
        }
        return true;
    }

    add_service(service: any): void {
        this.services[service.service_type()] = service;
    }

    build(): string {
        if (!this.__build_check()) {
            return '';
        }

        let signing = this.__signing();
        let signing_info = new ByteBuf()
            .putString(this.appId)
            .putUint32(this.issueTs)
            .putUint32(this.expire)
            .putUint32(this.salt)
            .putUint16(Object.keys(this.services).length)
            .pack();

        Object.values(this.services).forEach((service: any) => {
            signing_info = Buffer.concat([signing_info, service.pack()]);
        });

        const signature = encodeHMac(signing, signing_info);
        const content = Buffer.concat([new ByteBuf().putString(signature as any).pack(), signing_info]);
        const compressed = zlib.deflateSync(content);
        return `${getVersion()}${Buffer.from(compressed).toString('base64')}`;
    }

    from_string(origin_token: string): void {
        const origin_version = origin_token.substring(0, VERSION_LENGTH);
        if (origin_version !== getVersion()) {
            return;
        }

        const origin_content = origin_token.substring(VERSION_LENGTH, origin_token.length);
        const buffer = zlib.inflateSync(Buffer.from(origin_content, 'base64'));
        const bufferReader = new ReadByteBuf(buffer);

        const signature = bufferReader.getString();
        this.appId = bufferReader.getString();
        this.issueTs = bufferReader.getUint32();
        this.expire = bufferReader.getUint32();
        this.salt = bufferReader.getUint32();
        const service_count = bufferReader.getUint16();

        let remainBuf = bufferReader.pack();
        for (let i = 0; i < service_count; i++) {
            const bufferReaderService = new ReadByteBuf(remainBuf);
            const service_type = bufferReaderService.getUint16();
            const service = AccessToken.kServices[service_type]();
            remainBuf = service.unpack(bufferReaderService.pack()).pack();
            this.services[service_type] = service;
        }
    }
}

const encodeHMac = (key: Buffer, message: any): Buffer => {
    return crypto.createHmac('sha256', key).update(message).digest();
}

class ByteBuf {
    private buffer: Buffer;
    private position: number;

    constructor() {
        this.buffer = Buffer.alloc(1024);
        this.position = 0;
        this.buffer.fill(0);
    }

    pack(): Buffer {
        const out = Buffer.alloc(this.position);
        this.buffer.copy(out, 0, 0, out.length);
        return out;
    }

    putUint16(v: number): this {
        this.buffer.writeUInt16LE(v, this.position);
        this.position += 2;
        return this;
    }

    putUint32(v: number): this {
        this.buffer.writeUInt32LE(v, this.position);
        this.position += 4;
        return this;
    }

    putInt32(v: number): this {
        this.buffer.writeInt32LE(v, this.position);
        this.position += 4;
        return this;
    }

    putInt16(v: number): this {
        this.buffer.writeInt16LE(v, this.position);
        this.position += 2;
        return this;
    }

    putBytes(bytes: Buffer): this {
        this.putUint16(bytes.length);
        bytes.copy(this.buffer, this.position);
        this.position += bytes.length;
        return this;
    }

    putString(str: string): this {
        return this.putBytes(Buffer.from(str));
    }

    putTreeMap(map: { [key: number]: string }): this {
        if (!map) {
            this.putUint16(0);
            return this;
        }

        this.putUint16(Object.keys(map).length);
        for (const key in map) {
            this.putUint16(parseInt(key));
            this.putString(map[key]);
        }

        return this;
    }

    putTreeMapUInt32(map: { [key: number]: number }): this {
        if (!map) {
            this.putUint16(0);
            return this;
        }

        this.putUint16(Object.keys(map).length);
        for (const key in map) {
            this.putUint16(parseInt(key));
            this.putUint32(map[key]);
        }

        return this;
    }
}

class ReadByteBuf {
    private buffer: Buffer;
    private position: number;

    constructor(bytes: Buffer) {
        this.buffer = bytes;
        this.position = 0;
    }

    getUint16(): number {
        const ret = this.buffer.readUInt16LE(this.position);
        this.position += 2;
        return ret;
    }

    getUint32(): number {
        const ret = this.buffer.readUInt32LE(this.position);
        this.position += 4;
        return ret;
    }

    getInt16(): number {
        const ret = this.buffer.readInt16LE(this.position);
        this.position += 2;
        return ret;
    }

    getString(): string {
        const len = this.getUint16();
        const out = this.buffer.slice(this.position, this.position + len).toString();
        this.position += len;
        return out;
    }

    getTreeMapUInt32(): { [key: number]: number } {
        const map: { [key: number]: number } = {};
        const len = this.getUint16();
        for (let i = 0; i < len; i++) {
            const key = this.getUint16();
            const value = this.getUint32();
            map[key] = value;
        }
        return map;
    }

    pack(): Buffer {
        const length = this.buffer.length;
        const out = Buffer.alloc(length);
        this.buffer.copy(out, 0, this.position, length);
        return out;
    }
}

AccessToken.kServices = {
    [kApaasServiceType]: ServiceApaas,
    [kChatServiceType]: ServiceChat,
    [kFpaServiceType]: ServiceFpa,
    [kRtcServiceType]: ServiceRtc,
    [kRtmServiceType]: ServiceRtm,
};

export {
    AccessToken,
    kApaasServiceType,
    kChatServiceType,
    kFpaServiceType,
    kRtcServiceType,
    kRtmServiceType,
    ServiceApaas,
    ServiceChat,
    ServiceFpa,
    ServiceRtc,
    ServiceRtm
};
