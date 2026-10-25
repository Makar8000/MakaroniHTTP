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
  enabled: 0 | 1;
}

export type WallpaperDomainType = "danbooru" | "moebooru" | "custom";

export interface WallpaperDomainRow {
  name: string;
  base_url: string;
  tags: string;
  type: WallpaperDomainType;
}

export interface WallpaperQuery {
  limit?: number;
  offset?: number;
  tags?: string;
  random?: boolean;
  include_disabled?: boolean;
}

export type WallpaperDomainBody = Omit<WallpaperDomainRow, "type"> & { type?: WallpaperDomainType };
