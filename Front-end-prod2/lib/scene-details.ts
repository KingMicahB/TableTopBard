/**
 * SceneDetails Class
 * Manages scene data and associated music prompt with getters and setters
 */

import type { SceneData } from "./types"

export class SceneDetails {
  private _name?: string
  private _location: string
  private _vibeMood: string
  private _ambience: string
  private _whatsHappening: string
  private _isBattle: boolean
  private _energyLevel: string
  private _timeWeather?: string
  private _peopleCharacters?: string
  private _additionalNotes?: string
  private _musicPrompt?: string
  private _musicPromptGenerating: boolean = false
  private _musicPromptError?: string
  private _generatedMusic: Array<{
    id: string
    title: string
    audioUrl: string
    imageUrl?: string
    duration?: number
  }> = []

  constructor(data?: Partial<SceneData>) {
    this._name = data?.name
    this._location = data?.location || ""
    this._vibeMood = data?.vibeMood || ""
    this._ambience = data?.ambience || ""
    this._whatsHappening = data?.whatsHappening || ""
    this._isBattle = data?.isBattle || false
    this._energyLevel = data?.energyLevel || ""
    this._timeWeather = data?.timeWeather
    this._peopleCharacters = data?.peopleCharacters
    this._additionalNotes = data?.additionalNotes
  }

  // Getters
  get name(): string | undefined {
    return this._name
  }

  get location(): string {
    return this._location
  }

  get vibeMood(): string {
    return this._vibeMood
  }

  get ambience(): string {
    return this._ambience
  }

  get whatsHappening(): string {
    return this._whatsHappening
  }

  get isBattle(): boolean {
    return this._isBattle
  }

  get energyLevel(): string {
    return this._energyLevel
  }

  get timeWeather(): string | undefined {
    return this._timeWeather
  }

  get peopleCharacters(): string | undefined {
    return this._peopleCharacters
  }

  get additionalNotes(): string | undefined {
    return this._additionalNotes
  }

  get musicPrompt(): string | undefined {
    return this._musicPrompt
  }

  get musicPromptGenerating(): boolean {
    return this._musicPromptGenerating
  }

  get musicPromptError(): string | undefined {
    return this._musicPromptError
  }

  get generatedMusic(): Array<{
    id: string
    title: string
    audioUrl: string
    imageUrl?: string
    duration?: number
  }> {
    return [...this._generatedMusic] // Return a copy to prevent external mutation
  }

  // Setters
  set name(value: string | undefined) {
    this._name = value
  }

  set location(value: string) {
    this._location = value
  }

  set vibeMood(value: string) {
    this._vibeMood = value
  }

  set ambience(value: string) {
    this._ambience = value
  }

  set whatsHappening(value: string) {
    this._whatsHappening = value
  }

  set isBattle(value: boolean) {
    this._isBattle = value
  }

  set energyLevel(value: string) {
    this._energyLevel = value
  }

  set timeWeather(value: string | undefined) {
    this._timeWeather = value
  }

  set peopleCharacters(value: string | undefined) {
    this._peopleCharacters = value
  }

  set additionalNotes(value: string | undefined) {
    this._additionalNotes = value
  }

  set musicPrompt(value: string | undefined) {
    this._musicPrompt = value
    this._musicPromptError = undefined
  }

  set musicPromptGenerating(value: boolean) {
    this._musicPromptGenerating = value
    if (value) {
      this._musicPromptError = undefined
    }
  }

  set musicPromptError(value: string | undefined) {
    this._musicPromptError = value
  }

  set generatedMusic(
    value: Array<{
      id: string
      title: string
      audioUrl: string
      imageUrl?: string
      duration?: number
    }>
  ) {
    this._generatedMusic = [...value] // Store a copy
  }

  // Add a single song to generated music
  addGeneratedMusic(song: {
    id: string
    title: string
    audioUrl: string
    imageUrl?: string
    duration?: number
  }): void {
    // Check if song already exists (by id)
    if (!this._generatedMusic.find((s) => s.id === song.id)) {
      this._generatedMusic = [...this._generatedMusic, song]
    }
  }

  // Add multiple songs to generated music
  addGeneratedMusicMultiple(songs: Array<{
    id: string
    title: string
    audioUrl: string
    imageUrl?: string
    duration?: number
  }>): void {
    const newSongs = songs.filter(
      (song) => !this._generatedMusic.find((s) => s.id === song.id)
    )
    this._generatedMusic = [...this._generatedMusic, ...newSongs]
  }

  // Clear generated music
  clearGeneratedMusic(): void {
    this._generatedMusic = []
  }

  // Convert to SceneData format (for compatibility)
  toSceneData(): SceneData {
    return {
      name: this._name,
      location: this._location,
      vibeMood: this._vibeMood,
      ambience: this._ambience,
      whatsHappening: this._whatsHappening,
      isBattle: this._isBattle,
      energyLevel: this._energyLevel,
      timeWeather: this._timeWeather,
      peopleCharacters: this._peopleCharacters,
      additionalNotes: this._additionalNotes,
    }
  }

  // Update from SceneData
  updateFromSceneData(data: Partial<SceneData>): void {
    if (data.name !== undefined) this._name = data.name
    if (data.location !== undefined) this._location = data.location
    if (data.vibeMood !== undefined) this._vibeMood = data.vibeMood
    if (data.ambience !== undefined) this._ambience = data.ambience
    if (data.whatsHappening !== undefined) this._whatsHappening = data.whatsHappening
    if (data.isBattle !== undefined) this._isBattle = data.isBattle
    if (data.energyLevel !== undefined) this._energyLevel = data.energyLevel
    if (data.timeWeather !== undefined) this._timeWeather = data.timeWeather
    if (data.peopleCharacters !== undefined) this._peopleCharacters = data.peopleCharacters
    if (data.additionalNotes !== undefined) this._additionalNotes = data.additionalNotes
  }

  // Clone method
  clone(): SceneDetails {
    const cloned = new SceneDetails(this.toSceneData())
    cloned._musicPrompt = this._musicPrompt
    cloned._musicPromptGenerating = this._musicPromptGenerating
    cloned._musicPromptError = this._musicPromptError
    cloned._generatedMusic = [...this._generatedMusic]
    return cloned
  }
}
