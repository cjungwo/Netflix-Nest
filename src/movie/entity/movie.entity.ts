import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class Movie {
  @Expose()
  id: number;

  @Expose()
  title: string;

  genre: string;

  // @Expose()
  // get description() {
  //   return 'Enjoy~';
  // }
}
