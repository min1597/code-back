import axios from 'axios'
import { Token, TokenMethod, TokenStatus } from '../database/entity/Token.entity'
import { getDatabaseClient } from '../database/main'
import utilityPlugin from './utility.plugin'
import tokenPlugin from './token.plugin'
import CryptoJS from 'crypto-js'
import dayjs from 'dayjs'
import { User, UserStatus } from '../database/entity/User.entity'
import { ArrayContains } from 'typeorm'
import { Permission } from '../database/entity/Permission.entity'
import { Exception } from './error.plugin'
import { get } from 'http'
import { Username } from '../database/entity/Username.entity'
import { Algorithm, Password } from '../database/entity/Password.entity'
import { Gender, Profile } from '../database/entity/Profile.entity'
import { SSO } from '../database/entity/SSO.entity'
import bcrypt from 'bcrypt'
import certificationPlugin from './certification.plugin'
import { CertificationStatus, CertificationType } from '../database/entity/Certification.entity'

export default {
    pluginName: 'userPlugin',


    User: {
        search: async (_id: string & { __brand: 'UUID' }): Promise<
            {
                success: true,
                id: string & { __brand: 'UUID' },
                credentials: { username: string },
                profile: {
                    firstName: string,
                    middleName: string | null,
                    lastName: string,
                    nickName: string,
                    gender: Gender,
                    birthDate: string,
                    image: string | null
                },
                certifications: Array<{
                    id: string & { __brand: 'UUID' },
                    type: 'emailAddress' | 'phoneNumber',
                    isPrimary: boolean,
                    isActive: boolean,
                    addedDate: Date
                }>,

                Process: {
                    suspend: () => Promise<
                        { success: true }
                        | { success: false, error?: Error }
                    >,
                    unsuspend: () => Promise<
                        { success: true }
                        | { success: false, error?: Error }
                    >,
                    delete: () => Promise<
                        { success: true }
                        | { success: false, error?: Error }
                    >,
                    resetPassword: (_newPassword: string) => Promise<
                        { success: true }
                        | { success: false, error?: Error }
                    >
                }
            }
            | { success: false, error?: Error }
        > => {
            try {
                const _users = await getDatabaseClient().manager.getRepository(User).find({ where: { uuid: _id, is_active: true } })
                if(_users.length !== 1) return { success: false, error: new Error('Wrong user id.') }

                const _usernames = await getDatabaseClient().manager.getRepository(Username).find({ where: { uuid: _users[0].username_id, user_id: _users[0].uuid, is_active: true } })
                if(_usernames.length !== 1) return { success: false, error: new Error('Invalid username data.') }

                const _passwords = await getDatabaseClient().manager.getRepository(Password).find({ where: { uuid: _users[0].username_id, user_id: _users[0].uuid, is_active: true } })
                if(_passwords.length !== 1) return { success: false, error: new Error('Invalid password data.') }

                const _profiles = await getDatabaseClient().manager.getRepository(Profile).find({ where: { uuid: _users[0].username_id, user_id: _users[0].uuid, is_active: true } })
                if(_profiles.length !== 1) return { success: false, error: new Error('Invalid profile data.') }


                return {
                    success: true,
                    id: _users[0].uuid,
                    credentials: { username: _usernames[0].username },
                    profile: {
                        firstName: _profiles[0].first_name,
                        middleName: _profiles[0].middle_name,
                        lastName: _profiles[0].last_name,
                        nickName: _profiles[0].nick_name,
                        gender: _profiles[0].gender,
                        birthDate: dayjs(_profiles[0].birth_date).format('YYYY-MM-DD'),
                        image: _profiles[0].image
                    },
                    certifications: _users[0].certifications.map(_certification => {
                        return {
                            id: _certification.id,
                            type: _certification.type,
                            isPrimary: _certification.is_primary,
                            isActive: _certification.is_active,
                            addedDate: _certification.added_date
                        }
                    }),

                    Process: {
                        suspend: async (): Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        > => {
                            try {
                                if(_users[0].status !== UserStatus.Normal) return { success: false, error: new Error('Wrong user status.') }
                                const _updateResult = await getDatabaseClient().manager.getRepository(User).update({ uuid: _users[0].uuid, is_active: true }, { status: UserStatus.Suspended })
                                if(_updateResult.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                                _users[0].status = UserStatus.Suspended

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        unsuspend: async (): Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        > => {
                            try {
                                if(_users[0].status !== UserStatus.Suspended) return { success: false, error: new Error('Wrong user status.') }
                                const _updateResult = await getDatabaseClient().manager.getRepository(User).update({ uuid: _users[0].uuid, is_active: true }, { status: UserStatus.Normal })
                                if(_updateResult.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                                _users[0].status = UserStatus.Normal

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        delete: async (): Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        > => {
                            try {
                                if(_users[0].status !== UserStatus.Normal) return { success: false, error: new Error('Wrong user status.') }
                                const _updateResult = await getDatabaseClient().manager.getRepository(User).update({ uuid: _users[0].uuid, is_active: true }, { is_active: false, deleted_date: new Date() })
                                if(_updateResult.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                                await getDatabaseClient().manager.getRepository(Username).update({ user_id: _users[0].uuid, is_active: true }, { is_active: false, deleted_date: new Date() })
                                await getDatabaseClient().manager.getRepository(Password).update({ user_id: _users[0].uuid, is_active: true }, { is_active: false, deleted_date: new Date() })
                                await getDatabaseClient().manager.getRepository(Profile).update({ user_id: _users[0].uuid, is_active: true }, { is_active: false, deleted_date: new Date() })
                                await getDatabaseClient().manager.getRepository(SSO).update({ user_id: _users[0].uuid, is_active: true }, { is_active: false, deleted_date: new Date() })

                                _users[0].is_active = false

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        resetPassword: async (_newPassword: string): Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        > => {
                            try {
                                await getDatabaseClient().manager.getRepository(Password).update({ user_id: _users[0].uuid, is_active: true }, { is_active: false, deleted_date: new Date() })

                                const _Password = new Password()
                                _Password.algorithm = Algorithm.SHA256
                                _Password.salt = bcrypt.genSaltSync(10)
                                _Password.hash = utilityPlugin.RSA.encode(bcrypt.hashSync(CryptoJS.enc.Utf8.stringify(CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_newPassword))), _Password.salt))
                                _Password.user_id = _users[0].uuid
                                const _password = await getDatabaseClient().manager.save(_Password)

                                const _result = await getDatabaseClient().manager.getRepository(User).update({ uuid: _users[0].uuid }, { password_id: _password.uuid })
                                if(_result.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        }
                    }
                }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        register: async (
            _data: {
                credentials: { username: string, password: string },
                profile: {
                    firstName: string,
                    middleName?: string,
                    lastName: string,
                    nickname: string,
                    gender: 'male' | 'female'
                    birthDate: Date
                },
                certifications: Array<string & { __brand: 'UUID' }>
            }
        ): Promise<
            { success: true, id: string & { __brand: 'UUID' } }
            | { success: false, error?: Error }
        > => {
            try {
                const _usernames = await getDatabaseClient().manager.getRepository(Username).find({ where: { username: _data.credentials.username } })
                if(_usernames.length !== 0) return { success: false, error: new Error('Duplicated username.') }

                const _profiles = await getDatabaseClient().manager.getRepository(Profile).find({ where: { nick_name: _data.profile.nickname } })
                if(_profiles.length !== 0) return { success: false, error: new Error('Duplicated nickname.') }

                const _certifications: Array<{
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
                }> = [  ]

                for(const _certification of _data.certifications) {
                    const _result = await certificationPlugin.Certification.find(_certification)
                    if(_result.success == false) return { success: false, error: new Error('Wrong certification id.') }
                    _certifications.push(_result)
                }
                if(_certifications.filter(_certification => _certification.type == CertificationType.PHONE_NUMBER).length < 1) return { success: false, error: new Error('At least one phone number certification is required.') }
                if(_certifications.filter(_certification => _certification.type == CertificationType.EMAIL_ADDRESS).length < 1) return { success: false, error: new Error('At least one email address certification is required.') }

                const _User = new User()
                const _user = await getDatabaseClient().manager.save(_User)

                const _Username = new Username()
                _Username.username = _data.credentials.username
                _Username.user_id = _user.uuid
                const _username = await getDatabaseClient().manager.save(_Username)

                const _Password = new Password()
                _Password.algorithm = Algorithm.SHA256
                _Password.salt = bcrypt.genSaltSync(10)
                _Password.hash = utilityPlugin.RSA.encode(bcrypt.hashSync(CryptoJS.enc.Utf8.stringify(CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_data.credentials.password))), _Password.salt))
                _Password.user_id = _user.uuid
                const _password = await getDatabaseClient().manager.save(_Password)

                const _Profile = new Profile()
                _Profile.first_name = _data.profile.firstName
                _Profile.middle_name = _data.profile.middleName ?? null
                _Profile.last_name = _data.profile.lastName
                _Profile.nick_name = _data.profile.nickname
                _Profile.gender = { male: Gender.Male, female: Gender.Female }[_data.profile.gender]
                _Profile.birth_date = _data.profile.birthDate
                _Profile.user_id = _user.uuid
                const _profile = await getDatabaseClient().manager.save(_Profile)

                const _primaried: { [ key in 'emailAddress' | 'phoneNumber' ]: boolean } = { emailAddress: false, phoneNumber: false }
                const _updateResult = await getDatabaseClient().manager.getRepository(User).update({ uuid: _user.uuid }, { username_id: _username.uuid, password_id: _password.uuid, profile_id: _profile.uuid, certifications: _certifications.map(_certification => {
                    const _type = [ CertificationType.EMAIL_ADDRESS ].includes(_certification.type)
                        ? 'emailAddress'
                        : (
                            [ CertificationType.PHONE_NUMBER, CertificationType.KRID ].includes(_certification.type)
                                ? 'phoneNumber'
                                : undefined
                        )
                    return {
                        id: _certification.id,
                        type: _type,
                        is_primary: (_primaried[_type] ?? true) == false,
                        is_active: true,
                        added_date: new Date()
                    }
                }) })
                if(_updateResult.affected !== 1) return { success: false, error: new Error('Failed to update data.') }

                return { success: true, id: _user.uuid }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        }
    }
}