import { vi } from 'vitest';
import React from 'react';

// Mock Next.js modules
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    reload: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    isReady: true,
    isFallback: false,
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    return React.createElement('img', { src, alt, ...props });
  },
}));

vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: any) => {
    const Component = fn();
    return Component;
  },
}));

// Mock Next.js API functions
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(),
    })),
    redirect: vi.fn(),
    rewrite: vi.fn(),
  },
}));

// Mock Vercel Analytics
vi.mock('@vercel/analytics', () => ({
  Analytics: () => null,
  track: vi.fn(),
}));

// Mock Vercel Blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({
    url: 'https://example.com/blob/test-file',
    downloadUrl: 'https://example.com/blob/test-file',
  }),
  del: vi.fn().mockResolvedValue(undefined),
  head: vi.fn().mockResolvedValue({
    url: 'https://example.com/blob/test-file',
    size: 1024,
    contentType: 'application/json',
  }),
  list: vi.fn().mockResolvedValue({
    blobs: [],
    hasMore: false,
    cursor: undefined,
  }),
}));

// Mock SurveyJS
vi.mock('survey-core', () => ({
  Model: vi.fn().mockImplementation(() => ({
    data: {},
    setValue: vi.fn(),
    getValue: vi.fn(),
    onComplete: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    onCurrentPageChanged: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    onValueChanged: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    render: vi.fn(),
    doComplete: vi.fn(),
    clear: vi.fn(),
    state: 'running',
    currentPage: {},
    visiblePages: [],
    isFirstPage: true,
    isLastPage: false,
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    completeLastPage: vi.fn(),
  })),
  StylesManager: {
    applyTheme: vi.fn(),
  },
  settings: {
    supportCreatorV2: true,
  },
}));

vi.mock('survey-react-ui', () => ({
  Survey: ({ model, ...props }: any) => {
    return React.createElement('div', { 'data-testid': 'survey-component', ...props }, 'Mock Survey Component');
  },
}));

// Mock React Hook Form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn((fn) => fn),
    watch: vi.fn(),
    reset: vi.fn(),
    setValue: vi.fn(),
    getValue: vi.fn(),
    formState: {
      errors: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    },
    control: {},
  }),
  Controller: ({ render }: any) => render({
    field: {
      onChange: vi.fn(),
      onBlur: vi.fn(),
      value: '',
      name: 'test',
      ref: vi.fn(),
    },
    fieldState: {
      invalid: false,
      isTouched: false,
      isDirty: false,
      error: undefined,
    },
    formState: {
      errors: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    },
  }),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    span: ({ children, ...props }: any) => React.createElement('span', props, children),
    button: ({ children, ...props }: any) => React.createElement('button', props, children),
    form: ({ children, ...props }: any) => React.createElement('form', props, children),
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
}));

// Mock Zustand
vi.mock('zustand', () => ({
  create: (fn: any) => {
    const store = fn(() => ({}), () => ({}));
    return () => store;
  },
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => {
  const createIcon = (name: string) => ({ ...props }: any) => {
    return React.createElement('svg', { 'data-testid': `icon-${name.toLowerCase()}`, ...props }, 
      React.createElement('title', {}, name)
    );
  };

  return {
    ChevronLeft: createIcon('ChevronLeft'),
    ChevronRight: createIcon('ChevronRight'),
    ChevronDown: createIcon('ChevronDown'),
    ChevronUp: createIcon('ChevronUp'),
    Check: createIcon('Check'),
    X: createIcon('X'),
    Plus: createIcon('Plus'),
    Minus: createIcon('Minus'),
    Edit: createIcon('Edit'),
    Trash: createIcon('Trash'),
    Save: createIcon('Save'),
    Cancel: createIcon('Cancel'),
    Settings: createIcon('Settings'),
    User: createIcon('User'),
    Users: createIcon('Users'),
    Home: createIcon('Home'),
    Menu: createIcon('Menu'),
    Search: createIcon('Search'),
    Filter: createIcon('Filter'),
    Sort: createIcon('Sort'),
    Download: createIcon('Download'),
    Upload: createIcon('Upload'),
    Eye: createIcon('Eye'),
    EyeOff: createIcon('EyeOff'),
    Lock: createIcon('Lock'),
    Unlock: createIcon('Unlock'),
    Mail: createIcon('Mail'),
    Phone: createIcon('Phone'),
    Calendar: createIcon('Calendar'),
    Clock: createIcon('Clock'),
    MapPin: createIcon('MapPin'),
    Globe: createIcon('Globe'),
    Share: createIcon('Share'),
    Copy: createIcon('Copy'),
    Link: createIcon('Link'),
    ExternalLink: createIcon('ExternalLink'),
    ArrowLeft: createIcon('ArrowLeft'),
    ArrowRight: createIcon('ArrowRight'),
    ArrowUp: createIcon('ArrowUp'),
    ArrowDown: createIcon('ArrowDown'),
    Loader: createIcon('Loader'),
    Spinner: createIcon('Spinner'),
    AlertCircle: createIcon('AlertCircle'),
    AlertTriangle: createIcon('AlertTriangle'),
    Info: createIcon('Info'),
    CheckCircle: createIcon('CheckCircle'),
    XCircle: createIcon('XCircle'),
    HelpCircle: createIcon('HelpCircle'),
    Star: createIcon('Star'),
    Heart: createIcon('Heart'),
    ThumbsUp: createIcon('ThumbsUp'),
    ThumbsDown: createIcon('ThumbsDown'),
    MessageCircle: createIcon('MessageCircle'),
    MessageSquare: createIcon('MessageSquare'),
    Send: createIcon('Send'),
    Paperclip: createIcon('Paperclip'),
    Image: createIcon('Image'),
    File: createIcon('File'),
    Folder: createIcon('Folder'),
    FileText: createIcon('FileText'),
    Database: createIcon('Database'),
    Server: createIcon('Server'),
    Cloud: createIcon('Cloud'),
    Wifi: createIcon('Wifi'),
    Bluetooth: createIcon('Bluetooth'),
    Battery: createIcon('Battery'),
    Volume: createIcon('Volume'),
    VolumeX: createIcon('VolumeX'),
    Mic: createIcon('Mic'),
    MicOff: createIcon('MicOff'),
    Camera: createIcon('Camera'),
    Video: createIcon('Video'),
    Monitor: createIcon('Monitor'),
    Smartphone: createIcon('Smartphone'),
    Tablet: createIcon('Tablet'),
    Laptop: createIcon('Laptop'),
    Desktop: createIcon('Desktop'),
    Printer: createIcon('Printer'),
    Gamepad: createIcon('Gamepad'),
    Headphones: createIcon('Headphones'),
    Mouse: createIcon('Mouse'),
    Keyboard: createIcon('Keyboard'),
    Cpu: createIcon('Cpu'),
    HardDrive: createIcon('HardDrive'),
    MemoryStick: createIcon('MemoryStick'),
  };
});

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => {
    return React.createElement('div', { 'data-testid': 'responsive-container' }, children);
  },
  LineChart: ({ children }: any) => {
    return React.createElement('div', { 'data-testid': 'line-chart' }, children);
  },
  BarChart: ({ children }: any) => {
    return React.createElement('div', { 'data-testid': 'bar-chart' }, children);
  },
  PieChart: ({ children }: any) => {
    return React.createElement('div', { 'data-testid': 'pie-chart' }, children);
  },
  Line: () => React.createElement('div', { 'data-testid': 'line' }),
  Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
  Pie: () => React.createElement('div', { 'data-testid': 'pie' }),
  XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
  Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    text: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    output: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setFillColor: vi.fn(),
    rect: vi.fn(),
    circle: vi.fn(),
    line: vi.fn(),
    addImage: vi.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297,
      },
    },
  })),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatString) => {
    if (formatString === 'yyyy-MM-dd') {
      return '2023-01-01';
    }
    return '2023-01-01 12:00:00';
  }),
  formatDistance: vi.fn(() => 'about 1 hour ago'),
  formatDistanceToNow: vi.fn(() => 'about 1 hour ago'),
  parseISO: vi.fn((dateString) => new Date(dateString)),
  isValid: vi.fn(() => true),
  addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  startOfDay: vi.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())),
  endOfDay: vi.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)),
  isBefore: vi.fn(() => false),
  isAfter: vi.fn(() => false),
  isSameDay: vi.fn(() => false),
  differenceInDays: vi.fn(() => 0),
  differenceInHours: vi.fn(() => 0),
  differenceInMinutes: vi.fn(() => 0),
}));

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  SessionProvider: ({ children }: any) => children,
}));

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(() => 'mock-jwt-token'),
  verify: vi.fn(() => ({ userId: 'test-user', exp: Date.now() / 1000 + 3600 })),
  decode: vi.fn(() => ({ userId: 'test-user' })),
}));

// Mock crypto functions
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-1234'),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(64)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  },
});

// Mock RequestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Mock environment variables
// @ts-ignore
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';

export {};