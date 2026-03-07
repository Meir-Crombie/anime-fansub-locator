export type { Database } from './database.types'
export type { Tables } from './database.types'

import type { Tables } from './database.types'

export type Anime = Tables<'animes'>
export type FansubGroup = Tables<'fansub_groups'>
export type Translation = Tables<'translations'>
export type Profile = Tables<'profiles'>
export type SearchAnalytic = Tables<'search_analytics'>
export type Rating = Tables<'ratings'>
export type Announcement = Tables<'announcements'>
export type EpisodeProgress = Tables<'episode_progress'>
export type FormField = Tables<'form_fields'>
export type FansubApplication = Tables<'fansub_applications'>
export type SiteSettings = Tables<'site_settings'>
