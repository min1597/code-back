import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum Platform { Naver = 'Naver', Kakao = 'Kakao', Google = 'Google', Facebook = 'Facebook', Github = 'Github', Apple = 'Apple' }

@Entity()
export class SSO {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'SNS Link UUID' })
    uuid: string & { __brand: 'UUID' }

    
    @Column({ type: 'text', nullable: false, comment: 'SSO ID' })
    sso_id: string

    @Column({ type: 'enum', enum: Platform, nullable: false, comment: 'SSO Platform' })
    platform: Platform

    @Column({ type: 'uuid', nullable: false, comment: 'User UUID' })
    user_id: string & { __brand: 'UUID' }


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}