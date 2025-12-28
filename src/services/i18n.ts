import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

const STORAGE_KEY = 'keyPerfect_language';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'it';

export type NoteNamingSystem = 'letter' | 'solfege';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  noteSystem: NoteNamingSystem;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', noteSystem: 'letter', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', noteSystem: 'solfege', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', noteSystem: 'solfege', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', noteSystem: 'letter', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', noteSystem: 'letter', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', noteSystem: 'letter', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', noteSystem: 'solfege', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', noteSystem: 'solfege', rtl: false },
];

// Note name translations (letter to solfege)
export const NOTE_NAMES: Record<NoteNamingSystem, Record<string, string>> = {
  letter: {
    'C': 'C', 'C#': 'C#', 'D': 'D', 'D#': 'D#', 'E': 'E', 'F': 'F',
    'F#': 'F#', 'G': 'G', 'G#': 'G#', 'A': 'A', 'A#': 'A#', 'B': 'B',
  },
  solfege: {
    'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'D#': 'Re#', 'E': 'Mi', 'F': 'Fa',
    'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La', 'A#': 'La#', 'B': 'Si',
  },
};

// Translations dictionary
type TranslationKeys =
  | 'app.name'
  | 'home.welcome'
  | 'home.quickPlay'
  | 'home.continueLearnig'
  | 'home.gameModes'
  | 'home.seeAll'
  | 'practice.title'
  | 'practice.notes'
  | 'practice.chords'
  | 'practice.mixed'
  | 'practice.start'
  | 'learn.title'
  | 'learn.intervals'
  | 'learn.scales'
  | 'learn.progressions'
  | 'learn.circleOfFifths'
  | 'learn.theory'
  | 'stats.title'
  | 'stats.accuracy'
  | 'stats.streak'
  | 'stats.xp'
  | 'stats.levels'
  | 'settings.title'
  | 'settings.audio'
  | 'settings.volume'
  | 'settings.instrument'
  | 'settings.gameplay'
  | 'settings.autoPlay'
  | 'settings.showHints'
  | 'settings.hapticFeedback'
  | 'settings.accessibility'
  | 'settings.reducedMotion'
  | 'settings.language'
  | 'common.correct'
  | 'common.incorrect'
  | 'common.next'
  | 'common.back'
  | 'common.start'
  | 'common.continue'
  | 'common.finish'
  | 'common.cancel'
  | 'common.save'
  | 'common.reset'
  | 'game.speed'
  | 'game.survival'
  | 'game.daily'
  | 'game.timeUp'
  | 'game.gameOver'
  | 'game.score'
  | 'game.lives'
  | 'game.identifyNote'
  | 'game.identifyChord'
  | 'chord.major'
  | 'chord.minor'
  | 'chord.diminished'
  | 'chord.augmented'
  | 'chord.seventh';

const translations: Record<SupportedLanguage, Record<TranslationKeys, string>> = {
  en: {
    'app.name': 'Key Perfect',
    'home.welcome': 'Welcome back!',
    'home.quickPlay': 'Quick Play',
    'home.continueLearnig': 'Continue Learning',
    'home.gameModes': 'Game Modes',
    'home.seeAll': 'See all',
    'practice.title': 'Practice Mode',
    'practice.notes': 'Notes',
    'practice.chords': 'Chords',
    'practice.mixed': 'Mixed',
    'practice.start': 'Start Practice',
    'learn.title': 'Learn',
    'learn.intervals': 'Intervals',
    'learn.scales': 'Scales',
    'learn.progressions': 'Progressions',
    'learn.circleOfFifths': 'Circle of Fifths',
    'learn.theory': 'Music Theory',
    'stats.title': 'Statistics',
    'stats.accuracy': 'Accuracy',
    'stats.streak': 'Streak',
    'stats.xp': 'XP',
    'stats.levels': 'Levels',
    'settings.title': 'Settings',
    'settings.audio': 'Audio',
    'settings.volume': 'Volume',
    'settings.instrument': 'Instrument',
    'settings.gameplay': 'Gameplay',
    'settings.autoPlay': 'Auto-play Next',
    'settings.showHints': 'Show Hints',
    'settings.hapticFeedback': 'Haptic Feedback',
    'settings.accessibility': 'Accessibility',
    'settings.reducedMotion': 'Reduced Motion',
    'settings.language': 'Language',
    'common.correct': 'Correct!',
    'common.incorrect': 'Incorrect',
    'common.next': 'Next',
    'common.back': 'Back',
    'common.start': 'Start',
    'common.continue': 'Continue',
    'common.finish': 'Finish',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.reset': 'Reset',
    'game.speed': 'Speed Mode',
    'game.survival': 'Survival',
    'game.daily': 'Daily Challenge',
    'game.timeUp': "Time's Up!",
    'game.gameOver': 'Game Over',
    'game.score': 'Score',
    'game.lives': 'Lives',
    'game.identifyNote': 'Identify the note',
    'game.identifyChord': 'Identify the chord',
    'chord.major': 'Major',
    'chord.minor': 'Minor',
    'chord.diminished': 'Diminished',
    'chord.augmented': 'Augmented',
    'chord.seventh': 'Seventh',
  },
  es: {
    'app.name': 'Key Perfect',
    'home.welcome': '¡Bienvenido!',
    'home.quickPlay': 'Juego Rápido',
    'home.continueLearnig': 'Continuar Aprendiendo',
    'home.gameModes': 'Modos de Juego',
    'home.seeAll': 'Ver todo',
    'practice.title': 'Modo Práctica',
    'practice.notes': 'Notas',
    'practice.chords': 'Acordes',
    'practice.mixed': 'Mixto',
    'practice.start': 'Comenzar Práctica',
    'learn.title': 'Aprender',
    'learn.intervals': 'Intervalos',
    'learn.scales': 'Escalas',
    'learn.progressions': 'Progresiones',
    'learn.circleOfFifths': 'Círculo de Quintas',
    'learn.theory': 'Teoría Musical',
    'stats.title': 'Estadísticas',
    'stats.accuracy': 'Precisión',
    'stats.streak': 'Racha',
    'stats.xp': 'XP',
    'stats.levels': 'Niveles',
    'settings.title': 'Configuración',
    'settings.audio': 'Audio',
    'settings.volume': 'Volumen',
    'settings.instrument': 'Instrumento',
    'settings.gameplay': 'Jugabilidad',
    'settings.autoPlay': 'Reproducción Automática',
    'settings.showHints': 'Mostrar Pistas',
    'settings.hapticFeedback': 'Retroalimentación Háptica',
    'settings.accessibility': 'Accesibilidad',
    'settings.reducedMotion': 'Movimiento Reducido',
    'settings.language': 'Idioma',
    'common.correct': '¡Correcto!',
    'common.incorrect': 'Incorrecto',
    'common.next': 'Siguiente',
    'common.back': 'Atrás',
    'common.start': 'Comenzar',
    'common.continue': 'Continuar',
    'common.finish': 'Terminar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.reset': 'Reiniciar',
    'game.speed': 'Modo Velocidad',
    'game.survival': 'Supervivencia',
    'game.daily': 'Desafío Diario',
    'game.timeUp': '¡Tiempo!',
    'game.gameOver': 'Fin del Juego',
    'game.score': 'Puntuación',
    'game.lives': 'Vidas',
    'game.identifyNote': 'Identifica la nota',
    'game.identifyChord': 'Identifica el acorde',
    'chord.major': 'Mayor',
    'chord.minor': 'Menor',
    'chord.diminished': 'Disminuido',
    'chord.augmented': 'Aumentado',
    'chord.seventh': 'Séptima',
  },
  fr: {
    'app.name': 'Key Perfect',
    'home.welcome': 'Bienvenue !',
    'home.quickPlay': 'Jeu Rapide',
    'home.continueLearnig': "Continuer l'Apprentissage",
    'home.gameModes': 'Modes de Jeu',
    'home.seeAll': 'Voir tout',
    'practice.title': 'Mode Pratique',
    'practice.notes': 'Notes',
    'practice.chords': 'Accords',
    'practice.mixed': 'Mixte',
    'practice.start': 'Commencer la Pratique',
    'learn.title': 'Apprendre',
    'learn.intervals': 'Intervalles',
    'learn.scales': 'Gammes',
    'learn.progressions': 'Progressions',
    'learn.circleOfFifths': 'Cycle des Quintes',
    'learn.theory': 'Théorie Musicale',
    'stats.title': 'Statistiques',
    'stats.accuracy': 'Précision',
    'stats.streak': 'Série',
    'stats.xp': 'XP',
    'stats.levels': 'Niveaux',
    'settings.title': 'Paramètres',
    'settings.audio': 'Audio',
    'settings.volume': 'Volume',
    'settings.instrument': 'Instrument',
    'settings.gameplay': 'Jouabilité',
    'settings.autoPlay': 'Lecture Automatique',
    'settings.showHints': 'Afficher les Indices',
    'settings.hapticFeedback': 'Retour Haptique',
    'settings.accessibility': 'Accessibilité',
    'settings.reducedMotion': 'Mouvement Réduit',
    'settings.language': 'Langue',
    'common.correct': 'Correct !',
    'common.incorrect': 'Incorrect',
    'common.next': 'Suivant',
    'common.back': 'Retour',
    'common.start': 'Commencer',
    'common.continue': 'Continuer',
    'common.finish': 'Terminer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.reset': 'Réinitialiser',
    'game.speed': 'Mode Vitesse',
    'game.survival': 'Survie',
    'game.daily': 'Défi Quotidien',
    'game.timeUp': 'Temps Écoulé !',
    'game.gameOver': 'Partie Terminée',
    'game.score': 'Score',
    'game.lives': 'Vies',
    'game.identifyNote': 'Identifiez la note',
    'game.identifyChord': "Identifiez l'accord",
    'chord.major': 'Majeur',
    'chord.minor': 'Mineur',
    'chord.diminished': 'Diminué',
    'chord.augmented': 'Augmenté',
    'chord.seventh': 'Septième',
  },
  de: {
    'app.name': 'Key Perfect',
    'home.welcome': 'Willkommen zurück!',
    'home.quickPlay': 'Schnellspiel',
    'home.continueLearnig': 'Lernen Fortsetzen',
    'home.gameModes': 'Spielmodi',
    'home.seeAll': 'Alle anzeigen',
    'practice.title': 'Übungsmodus',
    'practice.notes': 'Noten',
    'practice.chords': 'Akkorde',
    'practice.mixed': 'Gemischt',
    'practice.start': 'Übung Starten',
    'learn.title': 'Lernen',
    'learn.intervals': 'Intervalle',
    'learn.scales': 'Tonleitern',
    'learn.progressions': 'Progressionen',
    'learn.circleOfFifths': 'Quintenzirkel',
    'learn.theory': 'Musiktheorie',
    'stats.title': 'Statistiken',
    'stats.accuracy': 'Genauigkeit',
    'stats.streak': 'Serie',
    'stats.xp': 'XP',
    'stats.levels': 'Stufen',
    'settings.title': 'Einstellungen',
    'settings.audio': 'Audio',
    'settings.volume': 'Lautstärke',
    'settings.instrument': 'Instrument',
    'settings.gameplay': 'Spielweise',
    'settings.autoPlay': 'Automatische Wiedergabe',
    'settings.showHints': 'Hinweise Anzeigen',
    'settings.hapticFeedback': 'Haptisches Feedback',
    'settings.accessibility': 'Barrierefreiheit',
    'settings.reducedMotion': 'Bewegung Reduzieren',
    'settings.language': 'Sprache',
    'common.correct': 'Richtig!',
    'common.incorrect': 'Falsch',
    'common.next': 'Weiter',
    'common.back': 'Zurück',
    'common.start': 'Starten',
    'common.continue': 'Fortfahren',
    'common.finish': 'Beenden',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.reset': 'Zurücksetzen',
    'game.speed': 'Geschwindigkeitsmodus',
    'game.survival': 'Überleben',
    'game.daily': 'Tägliche Herausforderung',
    'game.timeUp': 'Zeit Abgelaufen!',
    'game.gameOver': 'Spiel Vorbei',
    'game.score': 'Punktzahl',
    'game.lives': 'Leben',
    'game.identifyNote': 'Identifiziere die Note',
    'game.identifyChord': 'Identifiziere den Akkord',
    'chord.major': 'Dur',
    'chord.minor': 'Moll',
    'chord.diminished': 'Vermindert',
    'chord.augmented': 'Übermäßig',
    'chord.seventh': 'Septakkord',
  },
  ja: {
    'app.name': 'Key Perfect',
    'home.welcome': 'おかえりなさい！',
    'home.quickPlay': 'クイックプレイ',
    'home.continueLearnig': '学習を続ける',
    'home.gameModes': 'ゲームモード',
    'home.seeAll': 'すべて見る',
    'practice.title': '練習モード',
    'practice.notes': '音符',
    'practice.chords': 'コード',
    'practice.mixed': 'ミックス',
    'practice.start': '練習開始',
    'learn.title': '学ぶ',
    'learn.intervals': '音程',
    'learn.scales': 'スケール',
    'learn.progressions': 'コード進行',
    'learn.circleOfFifths': '五度圏',
    'learn.theory': '音楽理論',
    'stats.title': '統計',
    'stats.accuracy': '正確性',
    'stats.streak': '連続記録',
    'stats.xp': 'XP',
    'stats.levels': 'レベル',
    'settings.title': '設定',
    'settings.audio': 'オーディオ',
    'settings.volume': '音量',
    'settings.instrument': '楽器',
    'settings.gameplay': 'ゲームプレイ',
    'settings.autoPlay': '自動再生',
    'settings.showHints': 'ヒントを表示',
    'settings.hapticFeedback': '触覚フィードバック',
    'settings.accessibility': 'アクセシビリティ',
    'settings.reducedMotion': 'モーションを減らす',
    'settings.language': '言語',
    'common.correct': '正解！',
    'common.incorrect': '不正解',
    'common.next': '次へ',
    'common.back': '戻る',
    'common.start': '開始',
    'common.continue': '続ける',
    'common.finish': '終了',
    'common.cancel': 'キャンセル',
    'common.save': '保存',
    'common.reset': 'リセット',
    'game.speed': 'スピードモード',
    'game.survival': 'サバイバル',
    'game.daily': 'デイリーチャレンジ',
    'game.timeUp': 'タイムアップ！',
    'game.gameOver': 'ゲームオーバー',
    'game.score': 'スコア',
    'game.lives': 'ライフ',
    'game.identifyNote': '音符を当てる',
    'game.identifyChord': 'コードを当てる',
    'chord.major': 'メジャー',
    'chord.minor': 'マイナー',
    'chord.diminished': 'ディミニッシュ',
    'chord.augmented': 'オーギュメント',
    'chord.seventh': 'セブンス',
  },
  zh: {
    'app.name': 'Key Perfect',
    'home.welcome': '欢迎回来！',
    'home.quickPlay': '快速游戏',
    'home.continueLearnig': '继续学习',
    'home.gameModes': '游戏模式',
    'home.seeAll': '查看全部',
    'practice.title': '练习模式',
    'practice.notes': '音符',
    'practice.chords': '和弦',
    'practice.mixed': '混合',
    'practice.start': '开始练习',
    'learn.title': '学习',
    'learn.intervals': '音程',
    'learn.scales': '音阶',
    'learn.progressions': '和弦进行',
    'learn.circleOfFifths': '五度圈',
    'learn.theory': '乐理',
    'stats.title': '统计',
    'stats.accuracy': '准确率',
    'stats.streak': '连续',
    'stats.xp': '经验值',
    'stats.levels': '等级',
    'settings.title': '设置',
    'settings.audio': '音频',
    'settings.volume': '音量',
    'settings.instrument': '乐器',
    'settings.gameplay': '游戏玩法',
    'settings.autoPlay': '自动播放',
    'settings.showHints': '显示提示',
    'settings.hapticFeedback': '触觉反馈',
    'settings.accessibility': '无障碍',
    'settings.reducedMotion': '减少动画',
    'settings.language': '语言',
    'common.correct': '正确！',
    'common.incorrect': '错误',
    'common.next': '下一个',
    'common.back': '返回',
    'common.start': '开始',
    'common.continue': '继续',
    'common.finish': '完成',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.reset': '重置',
    'game.speed': '速度模式',
    'game.survival': '生存模式',
    'game.daily': '每日挑战',
    'game.timeUp': '时间到！',
    'game.gameOver': '游戏结束',
    'game.score': '分数',
    'game.lives': '生命',
    'game.identifyNote': '识别音符',
    'game.identifyChord': '识别和弦',
    'chord.major': '大调',
    'chord.minor': '小调',
    'chord.diminished': '减和弦',
    'chord.augmented': '增和弦',
    'chord.seventh': '七和弦',
  },
  pt: {
    'app.name': 'Key Perfect',
    'home.welcome': 'Bem-vindo!',
    'home.quickPlay': 'Jogo Rápido',
    'home.continueLearnig': 'Continuar Aprendendo',
    'home.gameModes': 'Modos de Jogo',
    'home.seeAll': 'Ver tudo',
    'practice.title': 'Modo Prática',
    'practice.notes': 'Notas',
    'practice.chords': 'Acordes',
    'practice.mixed': 'Misto',
    'practice.start': 'Iniciar Prática',
    'learn.title': 'Aprender',
    'learn.intervals': 'Intervalos',
    'learn.scales': 'Escalas',
    'learn.progressions': 'Progressões',
    'learn.circleOfFifths': 'Círculo das Quintas',
    'learn.theory': 'Teoria Musical',
    'stats.title': 'Estatísticas',
    'stats.accuracy': 'Precisão',
    'stats.streak': 'Sequência',
    'stats.xp': 'XP',
    'stats.levels': 'Níveis',
    'settings.title': 'Configurações',
    'settings.audio': 'Áudio',
    'settings.volume': 'Volume',
    'settings.instrument': 'Instrumento',
    'settings.gameplay': 'Jogabilidade',
    'settings.autoPlay': 'Reprodução Automática',
    'settings.showHints': 'Mostrar Dicas',
    'settings.hapticFeedback': 'Feedback Tátil',
    'settings.accessibility': 'Acessibilidade',
    'settings.reducedMotion': 'Reduzir Movimento',
    'settings.language': 'Idioma',
    'common.correct': 'Correto!',
    'common.incorrect': 'Incorreto',
    'common.next': 'Próximo',
    'common.back': 'Voltar',
    'common.start': 'Iniciar',
    'common.continue': 'Continuar',
    'common.finish': 'Finalizar',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.reset': 'Redefinir',
    'game.speed': 'Modo Velocidade',
    'game.survival': 'Sobrevivência',
    'game.daily': 'Desafio Diário',
    'game.timeUp': 'Tempo Esgotado!',
    'game.gameOver': 'Fim de Jogo',
    'game.score': 'Pontuação',
    'game.lives': 'Vidas',
    'game.identifyNote': 'Identifique a nota',
    'game.identifyChord': 'Identifique o acorde',
    'chord.major': 'Maior',
    'chord.minor': 'Menor',
    'chord.diminished': 'Diminuto',
    'chord.augmented': 'Aumentado',
    'chord.seventh': 'Sétima',
  },
  it: {
    'app.name': 'Key Perfect',
    'home.welcome': 'Bentornato!',
    'home.quickPlay': 'Gioco Rapido',
    'home.continueLearnig': 'Continua ad Apprendere',
    'home.gameModes': 'Modalità di Gioco',
    'home.seeAll': 'Vedi tutto',
    'practice.title': 'Modalità Pratica',
    'practice.notes': 'Note',
    'practice.chords': 'Accordi',
    'practice.mixed': 'Misto',
    'practice.start': 'Inizia Pratica',
    'learn.title': 'Impara',
    'learn.intervals': 'Intervalli',
    'learn.scales': 'Scale',
    'learn.progressions': 'Progressioni',
    'learn.circleOfFifths': 'Circolo delle Quinte',
    'learn.theory': 'Teoria Musicale',
    'stats.title': 'Statistiche',
    'stats.accuracy': 'Precisione',
    'stats.streak': 'Serie',
    'stats.xp': 'XP',
    'stats.levels': 'Livelli',
    'settings.title': 'Impostazioni',
    'settings.audio': 'Audio',
    'settings.volume': 'Volume',
    'settings.instrument': 'Strumento',
    'settings.gameplay': 'Giocabilità',
    'settings.autoPlay': 'Riproduzione Automatica',
    'settings.showHints': 'Mostra Suggerimenti',
    'settings.hapticFeedback': 'Feedback Aptico',
    'settings.accessibility': 'Accessibilità',
    'settings.reducedMotion': 'Ridurre il Movimento',
    'settings.language': 'Lingua',
    'common.correct': 'Corretto!',
    'common.incorrect': 'Sbagliato',
    'common.next': 'Avanti',
    'common.back': 'Indietro',
    'common.start': 'Inizia',
    'common.continue': 'Continua',
    'common.finish': 'Finisci',
    'common.cancel': 'Annulla',
    'common.save': 'Salva',
    'common.reset': 'Reimposta',
    'game.speed': 'Modalità Velocità',
    'game.survival': 'Sopravvivenza',
    'game.daily': 'Sfida Giornaliera',
    'game.timeUp': 'Tempo Scaduto!',
    'game.gameOver': 'Partita Finita',
    'game.score': 'Punteggio',
    'game.lives': 'Vite',
    'game.identifyNote': 'Identifica la nota',
    'game.identifyChord': "Identifica l'accordo",
    'chord.major': 'Maggiore',
    'chord.minor': 'Minore',
    'chord.diminished': 'Diminuito',
    'chord.augmented': 'Aumentato',
    'chord.seventh': 'Settima',
  },
};

// Current language state
let currentLanguage: SupportedLanguage = 'en';
let currentNoteSystem: NoteNamingSystem = 'letter';

// Get device language
function getDeviceLanguage(): SupportedLanguage {
  try {
    let deviceLang = 'en';

    if (Platform.OS === 'ios') {
      deviceLang = NativeModules.SettingsManager?.settings?.AppleLocale ||
                   NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en';
    } else if (Platform.OS === 'android') {
      deviceLang = NativeModules.I18nManager?.localeIdentifier || 'en';
    }

    // Extract language code (e.g., 'en_US' -> 'en')
    const langCode = deviceLang.split('_')[0].split('-')[0] as SupportedLanguage;

    // Check if supported
    if (SUPPORTED_LANGUAGES.some(l => l.code === langCode)) {
      return langCode;
    }
  } catch (error) {
    console.error('Error getting device language:', error);
  }

  return 'en';
}

// Initialize language
export async function initializeLanguage(): Promise<SupportedLanguage> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      currentLanguage = saved as SupportedLanguage;
    } else {
      currentLanguage = getDeviceLanguage();
    }

    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage);
    currentNoteSystem = langConfig?.noteSystem || 'letter';

    return currentLanguage;
  } catch (error) {
    console.error('Error initializing language:', error);
    return 'en';
  }
}

// Set language
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    currentLanguage = lang;

    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    currentNoteSystem = langConfig?.noteSystem || 'letter';
  } catch (error) {
    console.error('Error setting language:', error);
  }
}

// Get current language
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

// Get current note naming system
export function getNoteSystem(): NoteNamingSystem {
  return currentNoteSystem;
}

// Translate a key
export function t(key: TranslationKeys): string {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

// Translate note name based on current system
export function translateNote(note: string): string {
  // Handle notes with octave numbers (e.g., 'C4')
  const match = note.match(/^([A-G]#?)(\d*)$/);
  if (match) {
    const [, noteName, octave] = match;
    const translated = NOTE_NAMES[currentNoteSystem][noteName] || noteName;
    return octave ? `${translated}${octave}` : translated;
  }
  return NOTE_NAMES[currentNoteSystem][note] || note;
}

// Translate chord name
export function translateChord(chord: string): string {
  // e.g., "C Major" -> "Do Mayor" (in Spanish with solfege)
  const parts = chord.split(' ');
  if (parts.length >= 2) {
    const note = translateNote(parts[0]);
    const type = parts.slice(1).join(' ');

    // Translate chord type
    let translatedType = type;
    if (type.toLowerCase() === 'major') translatedType = t('chord.major');
    else if (type.toLowerCase() === 'minor') translatedType = t('chord.minor');
    else if (type.toLowerCase() === 'diminished') translatedType = t('chord.diminished');
    else if (type.toLowerCase() === 'augmented') translatedType = t('chord.augmented');

    return `${note} ${translatedType}`;
  }
  return chord;
}

// Check if current language is RTL
export function isRTL(): boolean {
  return SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.rtl || false;
}
