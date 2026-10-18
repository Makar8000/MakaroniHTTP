export interface WallpaperBody {
  title: string;
  tags: string;
  file_url: string;
  enabled: boolean;
}

export interface WallpaperRow {
  id: number;
  file_url: string;
  title: string;
  tags: string;
}

export interface WallpaperQuery {
  limit?: number;
  tags?: string;
}
