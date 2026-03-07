## ADDED Requirements

### Requirement: Vocal Phrase Storage
The system SHALL store vocal phrases linked to songs in a dedicated table.

#### Scenario: VocalPhrase schema
- **WHEN** the database schema is defined
- **THEN** the vocalPhrases table SHALL have fields: id (auto-increment), phrase (string), songId (string, references songs)
- **AND** the table SHALL be added in a new Dexie schema version with migration

#### Scenario: Vocal phrase service CRUD
- **WHEN** vocalPhraseService is used
- **THEN** getAll() SHALL return all phrases
- **AND** add(phrase, songId) SHALL insert and return the new id
- **AND** delete(id) SHALL remove the phrase
- **AND** getPhrasesForSong(songId) SHALL return phrases for that song
- **AND** searchPhrases(query) SHALL return phrases where phrase contains query (case-insensitive)

### Requirement: Vocal Phrase Index UI
The system SHALL provide a Vocal Phrase Index panel accessible from the main navigation.

#### Scenario: Open phrases panel
- **WHEN** the user clicks "Phrases" in the navigation bar
- **THEN** a panel (modal or drawer) SHALL open showing the list of vocal phrases
- **AND** each row SHALL show the phrase text and an options menu

#### Scenario: Hover tooltip source song
- **WHEN** the user hovers over a phrase row
- **THEN** a tooltip SHALL show the source song as "title — artist"
- **AND** the song SHALL be resolved from the provided allSongs (or song list) by songId

#### Scenario: Add phrase
- **WHEN** the user clicks "[+ Add Phrase]"
- **THEN** a modal SHALL open with a text input for the phrase and a searchable song selector
- **AND** the song selector SHALL use Fuse.js (or existing searchService) for search
- **AND** on save the phrase SHALL be stored with the selected songId

#### Scenario: Search phrases
- **WHEN** the user enters text in the phrase search
- **THEN** the list SHALL filter to phrases matching the query (case-insensitive includes)
