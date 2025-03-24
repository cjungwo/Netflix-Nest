import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

// @Entity()
// @TableInheritance({
//   column: {
//     type: 'varchar',
//     name: 'type',
//   },
// })
// export class Content extends BaseEntity {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   title: string;

//   @Column()
//   genre: string;
// }

// movie / series -> Content
// runtime / seriesCount

@Entity()
export class Movie extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  // Embedded
  // @Column(() => BaseEntity)
  // base: BaseEntity;
}

// @ChildEntity()
// export class Series extends Content {
//   @Column()
//   seriesCount: number;
// }
