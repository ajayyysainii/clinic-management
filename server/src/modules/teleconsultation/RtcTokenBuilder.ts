import { AccessToken, ServiceRtc, ServiceRtm } from './AccessToken';

enum Role {
    /**
     * RECOMMENDED. Use this role for a voice/video call or a live broadcast, if
     * your scenario does not require authentication for
     * [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
     */
    PUBLISHER = 1,

    /**
     * Only use this role if your scenario requires authentication for
     * [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
     *
     * @note In order for this role to take effect, please contact our support team
     * to enable authentication for Hosting-in for you. Otherwise, Role_Subscriber
     * still has the same privileges as Role_Publisher.
     */
    SUBSCRIBER = 2
}

class RtcTokenBuilder {
    /**
     * Builds an RTC token using an Integer uid.
     * @param appId The App ID issued to you by Agora.
     * @param appCertificate Certificate of the application that you registered in the Agora Dashboard.
     * @param channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes.
     * @param uid User ID. A 32-bit unsigned integer with a value ranging from 1 to (2^32-1).
     * @param role See #userRole.
     * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
     * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
     * @param tokenExpire Represented by the number of seconds elapsed since now.
     * @param privilegeExpire Represented by the number of seconds elapsed since now.
     * @returns The RTC Token.
     */
    static buildTokenWithUid(
        appId: string,
        appCertificate: string,
        channelName: string,
        uid: any,
        role: Role,
        tokenExpire: number,
        privilegeExpire: number = 0
    ): string {
        return this.buildTokenWithUserAccount(
            appId,
            appCertificate,
            channelName,
            uid,
            role,
            tokenExpire,
            privilegeExpire
        );
    }

    /**
     * Builds an RTC token with account.
     * @param appId The App ID issued to you by Agora.
     * @param appCertificate Certificate of the application that you registered in the Agora Dashboard.
     * @param channelName The unique channel name for the AgoraRTC session in string format.
     * @param account The user account.
     * @param role See #userRole.
     * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
     * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
     * @param tokenExpire Represented by the number of seconds elapsed since now.
     * @param privilegeExpire Represented by the number of seconds elapsed since now.
     * @returns The RTC Token.
     */
    static buildTokenWithUserAccount(
        appId: string,
        appCertificate: string,
        channelName: string,
        account: any,
        role: Role,
        tokenExpire: number,
        privilegeExpire: number = 0
    ): string {
        const token = new AccessToken(appId, appCertificate, 0, tokenExpire);

        const serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpire);
        if (role === Role.PUBLISHER) {
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpire);
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpire);
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpire);
        }
        token.add_service(serviceRtc);

        return token.build();
    }

    /**
     * Generates an RTC token with the specified privilege.
     * @param appId The App ID of your Agora project.
     * @param appCertificate The App Certificate of your Agora project.
     * @param channelName The unique channel name for the Agora RTC session in string format.
     * @param uid The user ID. A 32-bit unsigned integer with a value range from 1 to (2^32 - 1).
     * @param tokenExpire Represented by the number of seconds elapsed since now.
     * @param joinChannelPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubAudioPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubVideoPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubDataStreamPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @returns The RTC Token
     */
    static buildTokenWithUidAndPrivilege(
        appId: string,
        appCertificate: string,
        channelName: string,
        uid: any,
        tokenExpire: number,
        joinChannelPrivilegeExpire: number,
        pubAudioPrivilegeExpire: number,
        pubVideoPrivilegeExpire: number,
        pubDataStreamPrivilegeExpire: number
    ): string {
        return this.BuildTokenWithUserAccountAndPrivilege(
            appId,
            appCertificate,
            channelName,
            uid,
            tokenExpire,
            joinChannelPrivilegeExpire,
            pubAudioPrivilegeExpire,
            pubVideoPrivilegeExpire,
            pubDataStreamPrivilegeExpire
        );
    }

    /**
     * Generates an RTC token with the specified privilege.
     * @param appId The App ID of your Agora project.
     * @param appCertificate The App Certificate of your Agora project.
     * @param channelName The unique channel name for the Agora RTC session in string format.
     * @param account The user account.
     * @param tokenExpire Represented by the number of seconds elapsed since now.
     * @param joinChannelPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubAudioPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubVideoPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubDataStreamPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @returns The RTC Token.
     */
    static BuildTokenWithUserAccountAndPrivilege(
        appId: string,
        appCertificate: string,
        channelName: string,
        account: any,
        tokenExpire: number,
        joinChannelPrivilegeExpire: number,
        pubAudioPrivilegeExpire: number,
        pubVideoPrivilegeExpire: number,
        pubDataStreamPrivilegeExpire: number
    ): string {
        const token = new AccessToken(appId, appCertificate, 0, tokenExpire);

        const serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        token.add_service(serviceRtc);

        return token.build();
    }

    /**
     * Build an RTC and RTM token with account.
     * @param appId The App ID issued to you by Agora.
     * @param appCertificate Certificate of the application that you registered in the Agora Dashboard.
     * @param channelName The unique channel name for the Agora RTC session in string format.
     * @param account The user account.
     * @param role See #userRole.
     * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
     * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
     * @param tokenExpire Represented by the number of seconds elapsed since now.
     * @param privilegeExpire Represented by the number of seconds elapsed since now.
     * @returns The RTC and RTM Token.
     */
    static buildTokenWithRtm(
        appId: string,
        appCertificate: string,
        channelName: string,
        account: any,
        role: Role,
        tokenExpire: number,
        privilegeExpire: number = 0
    ): string {
        const token = new AccessToken(appId, appCertificate, 0, tokenExpire);

        const serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpire);
        if (role === Role.PUBLISHER) {
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpire);
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpire);
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpire);
        }
        token.add_service(serviceRtc);

        const serviceRtm = new ServiceRtm(account);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, tokenExpire);
        token.add_service(serviceRtm);

        return token.build();
    }

    /**
     * Build an RTC and RTM token with account.
     * @param appId The App ID issued to you by Agora.
     * @param appCertificate Certificate of the application that you registered in the Agora Dashboard.
     * @param channelName The unique channel name for the Agora RTC session in string format.
     * @param rtcAccount The RTC user's account.
     * @param rtcRole See #userRole.
     * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
     * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
     * @param rtcTokenExpire Represented by the number of seconds elapsed since now.
     * @param joinChannelPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubAudioPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubVideoPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param pubDataStreamPrivilegeExpire Represented by the number of seconds elapsed since now.
     * @param rtmUserId The RTM user's account.
     * @param rtmTokenExpire Represented by the number of seconds elapsed since now.
     * @returns The RTC and RTM Token.
     */
    static buildTokenWithRtm2(
        appId: string,
        appCertificate: string,
        channelName: string,
        rtcAccount: any,
        rtcRole: Role,
        rtcTokenExpire: number,
        joinChannelPrivilegeExpire: number,
        pubAudioPrivilegeExpire: number,
        pubVideoPrivilegeExpire: number,
        pubDataStreamPrivilegeExpire: number,
        rtmUserId: string,
        rtmTokenExpire: number
    ): string {
        const token = new AccessToken(appId, appCertificate, 0, rtcTokenExpire);

        const serviceRtc = new ServiceRtc(channelName, rtcAccount);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        if (rtcRole === Role.PUBLISHER) {
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
            serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        }
        token.add_service(serviceRtc);

        const serviceRtm = new ServiceRtm(rtmUserId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, rtmTokenExpire);
        token.add_service(serviceRtm);

        return token.build();
    }
}

export { RtcTokenBuilder, Role };
