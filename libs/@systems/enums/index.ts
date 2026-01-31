export enum RoomStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

export enum GameMode {
  CLASSIC = 'classic', // Civilians + 1 Undercover
  EXTENDED = 'extended' // Civilians + 1 Undercover + 1 Mr. White
}

export enum GameStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

export enum PlayerRole {
  CIVILIAN = 'civilian',
  UNDERCOVER = 'undercover',
  MR_WHITE = 'mr_white'
}

export enum PlayerStatus {
  ALIVE = 'alive',
  ELIMINATED = 'eliminated'
}

export enum WinnerRole {
  CIVILIANS = 'civilians',
  UNDERCOVER = 'undercover',
  MR_WHITE = 'mr_white'
}






