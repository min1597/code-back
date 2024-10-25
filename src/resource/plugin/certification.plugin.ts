import { Certification, CertificationStatus, CertificationType } from '../database/entity/Certification.entity'
import notificationPlugin from './notification.plugin'
import libphonenumber from 'libphonenumber-js'
import utilityPlugin from './utility.plugin'
import { getDatabaseClient } from '../database/main'
import * as dayjs from 'dayjs'

function generateHTML (_code: string) {
    return `<div style="margin: 0; padding: 0; text-align: center;">
        <div style="width: 90vw; max-width: 600px; display: inline-block; text-align: left;">
            <br><br>
            <p style="color: gray; font-size: 16px; margin-bottom: 0;">루나 통합계정</p>
            <h1 style="margin-bottom: 40px; margin-top: 4px; color: #333333; font-weight: 700; font-size: 32px;">이메일 인증 안내</h1>
            <p style="margin-bottom: 30px; color: gray; line-height: 14px; font-size: 12px;">혹시 이 메일을 스팸함에서 발견하셨나요? 그렇다면 <a href="https://moji.or.kr/spam" style="color: gray; font-weight: bold; text-decoration: underline;" rel="noopener noreferrer" target="_blank">여기</a>를 눌러 스팸 메일로 분류되는 것을 막아주세요.</p>
            <p style="margin-bottom: 12px; color: #333333; line-height: 24px;">안전한 서비스 이용을 위해 아래 인증 번호를 인증 시간 이내에 홈페이지에 입력해 주세요!</p>
            <p style="margin-bottom: 24px; color: #333333; line-height: 24px;">인증번호 : <b>${ _code }</b></p>
    
            <p style="color: #333333; line-height: 24px;">서비스 이용에 궁금한 내용이 있다면 <a href="https://moji.or.kr" style="color: #333333; text-decoration: underline;" rel="noopener noreferrer" target="_blank">루나 통합 고객센터</a>로 연락주시면 친절히 답변드릴게요.</p>
            <br><hr style="border: 0.6px #dfe0e4 solid;"><br>
            <div>
                <p style="font-size: 12px; color: gray;">본 메일은 루나 서비스에 대한 중요한 내용을 안내드리기 위해 발송되었습니다. 만약 루나 서비스를 이용하신 적이 없다면 <a href="https://moji.or.kr/complaint-center" style="color: gray; text-decoration: underline;" rel="noopener noreferrer" target="_blank">루나 통합 고객센터</a>로 연락주시기 바랍니다.</p>
                <br>
                <a style="text-decoration: underline; cursor: pointer; font-size: 12px; color: gray;" href="https://moji.or.kr/privacy-policy" rel="noopener noreferrer" target="_blank">이용약관</a>
                <a style="font-size: 12px; color: gray;">|</a>
                <a style="text-decoration: underline; cursor: pointer; font-size: 12px; color: gray;" href="https://moji.or.kr/privacy-policy" rel="noopener noreferrer" target="_blank">개인정보처리방침</a>
                <a style="font-size: 12px; color: gray;">|</a>
                <a style="text-decoration: underline; cursor: pointer; font-size: 12px; color: gray;" href="https://moji.or.kr/privacy-policy" rel="noopener noreferrer" target="_blank">고객센터</a>
            </div>
            <br><br>
        </div>
    </div>`
}

export default {
    pluginName: 'certificationPlugin',

    Certification: {
        find: async (_id: string & { __brand: 'UUID' }): Promise<
            {
                success: true,
                id: string & { __brand: 'UUID' },
                type: CertificationType,
                status: CertificationStatus,
                expiresDate: Date,
                Process: {
                    verify: (_code: string) => Promise<
                        { success: true }
                        | { success: false, error?: Error }
                    >,
                    revoke: () => Promise<
                        { success: true }
                        | { success: false, error?: Error }
                    >,
                    register: (_id: string & { __brand: 'UUID' }) => Promise<
                        { success: true }
                        | { success: false, error?: Error }
                    >,
                    unregister: () => Promise<
                        { success: true }
                        | { success: false, error?: Error }
                    >,
                }
            }
            | { success: false, error?: Error }
        > => {
            try {
                const _certifications = await getDatabaseClient().manager.getRepository(Certification).find({ where: { uuid: _id, is_active: true } })
                if(_certifications.length !== 1) return { success: false, error: new Error('Wrong certification id.') }
                if(dayjs(_certifications[0].expires_date).diff() <= 0) return { success: false, error: new Error('Expired certification.') }
                return {
                    success: true,
                    id: _certifications[0].uuid,
                    type: _certifications[0].type,
                    status: _certifications[0].status,
                    expiresDate: _certifications[0].expires_date,
                    Process: {
                        verify: async (_code: string): Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        > => {
                            try {
                                if(_certifications[0].status !== CertificationStatus.Pending) return { success: false, error: new Error('Wrong certification.') }
                                if(dayjs(_certifications[0].expires_date).diff() <= 0) return { success: false, error: new Error('Expired certification.') }
                                if(_code !== _certifications[0].verification_code) return { success: false, error: new Error('Wrong verification code.') }
                                const _result = await getDatabaseClient().manager.getRepository(Certification).update({ uuid: _certifications[0].uuid, is_active: true }, { status: CertificationStatus.Successed })
                                if(_result.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                                _certifications[0].status = CertificationStatus.Successed

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        revoke: async (): Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        > => {
                            try {
                                if(_certifications[0].status == CertificationStatus.Registered) return { success: false, error: new Error('Related data is exist.') }
                                const _result = await getDatabaseClient().manager.getRepository(Certification).update({ uuid: _certifications[0].uuid, is_active: true }, { is_active: false, deleted_date: new Date() })
                                if(_result.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                                _certifications[0].is_active = false

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        register: async (_id: string & { __brand: 'UUID' }): Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        > => {
                            try {
                                if(_certifications[0].status !== CertificationStatus.Successed) return { success: false, error: new Error('Wrong certification status.') }
                                const _result = await getDatabaseClient().manager.getRepository(Certification).update({ uuid: _certifications[0].uuid, is_active: true }, { status: CertificationStatus.Registered, user_id: _id })
                                if(_result.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                                _certifications[0].user_id = _id
                                _certifications[0].status = CertificationStatus.Registered

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        unregister: async (): Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        > => {
                            try {
                                if(_certifications[0].status !== CertificationStatus.Registered) return { success: false, error: new Error('Wrong certification status.') }
                                const _result = await getDatabaseClient().manager.getRepository(Certification).update({ uuid: _certifications[0].uuid, is_active: true }, { status: CertificationStatus.Used })
                                if(_result.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                                _certifications[0].user_id = null
                                _certifications[0].status = CertificationStatus.Used

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                    }
                }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        create: async (_type: 'phoneNumber' | 'emailAddress', _target: string, _option?: { type: 'KRID', name: string, birthdate: string, carrier: 'KT' | 'SKT' | 'LGUP', isMVNO: boolean }): Promise<
            {
                success: true,
                id: string & { __brand: 'UUID' },
                expiresDate: Date
            }
            | { success: false, error?: Error }
        > => {
            try {
                if(_type == 'phoneNumber') {
                    if(_option == undefined) {
                        if(libphonenumber(_target).isValid() !== true) return { success: false, error: new Error('Invalid phone number.') }
    
                        const _Certification = new Certification()
                        _Certification.type = CertificationType.PHONE_NUMBER
                        _Certification.data = libphonenumber(_target).format('INTERNATIONAL')
                        _Certification.verification_code = utilityPlugin.getRandomStrings(6, '0123456789')
                        _Certification.expires_date = dayjs().add(3, 'minutes').toDate()
    
                        const _certification = await getDatabaseClient().manager.save(_Certification)
    
                        const _result = await notificationPlugin.Notification.SMS.send(_certification.data, `[루나 통합계정] 인증번호는 (${ _certification.verification_code }) 입니다.\n제한시간 내 입력해주세요.`)
                        console.log(_result)
                        if(_result.success == false) return { success: false, error: new Error('Failed to send SMS.', { cause: _result.error }) }
    
                        return {
                            success: true,
                            id: _certification.uuid,
                            expiresDate: _certification.expires_date
                        }
                    } else if(_option.type == 'KRID') {
                        return { success: false, error: new Error('TODO:: This method is maintenance now.') }
                    } else return { success: false, error: new Error('Unsupported option.') }
                } else if(_type == 'emailAddress') {
                    if(_option == undefined) {
                        if(utilityPlugin.isEmailAddress(_target) == false) return { success: false, error: new Error('Invalid email address.') }
    
                        const _Certification = new Certification()
                        _Certification.type = CertificationType.PHONE_NUMBER
                        _Certification.data = _target
                        _Certification.verification_code = utilityPlugin.getRandomStrings(6, '0123456789')
                        _Certification.expires_date = dayjs().add(30, 'minutes').toDate()
    
                        const _certification = await getDatabaseClient().manager.save(_Certification)
    
                        const _result = await notificationPlugin.Notification.SMTP.send(_certification.data, '[ 루나 통합계정 ] 이메일 인증번호', generateHTML(_certification.verification_code))
                        if(_result.success == false) return { success: false, error: new Error('Failed to send SMTP.', { cause: _result.error }) }
    
                        return {
                            success: true,
                            id: _certification.uuid,
                            expiresDate: _certification.expires_date
                        }
                    } else return { success: false, error: new Error('Unsupported option.') }
                }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        }
    }
}