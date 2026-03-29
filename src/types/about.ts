// About page data types

export interface Artist {
  name: string;
  category: 'Anime' | 'Western' | 'K-Pop';
  youtube: string;
  image: string;
}

export interface Developer {
  name: string;
  description: string;
  youtube: string;
  image: string;
}
