import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum Gender { Male = 'Male', Female = 'Female' }

@Entity()
export class Profile {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'varchar', length: 100, nullable: false, comment: 'First name' })
    first_name: string

    @Column({ type: 'varchar', length: 100, nullable: true, default: null, comment: 'Middle name' })
    middle_name: string | null

    @Column({ type: 'varchar', length: 100, nullable: false, comment: 'Last name' })
    last_name: string

    @Column({ type: 'varchar', length: 100, nullable: false, comment: 'Nick name' })
    nick_name: string

    @Column({ type: 'enum', enum: Gender, nullable: false, comment: 'Gender' })
    gender: Gender

    @Column({ type: 'timestamptz', nullable: false, comment: 'Birth date (YYYY-MM-DDT00:00:00+00:00)' })
    birth_date: Date

    @Column({ type: 'text', nullable: true, default: null, comment: 'Profile image' })
    image: string | null

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
