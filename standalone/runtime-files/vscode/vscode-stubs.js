// vscode-stubs.js — dynamic universal shim for non-extension runtimes
// SAFE TO EDIT: add enums or tweak patterns for your own usage
const { createStub } = require('./stub-utils');

// Toggle chatter with: VSCODE_STUB_DEBUG=1
const DEBUG = process.env.VSCODE_STUB_DEBUG === '1';
const log = (...a) => DEBUG && console.info('[vscode-stub]', ...a);

// Async-like APIs that should return a Promise<null>
const ASYNC_PATTERNS = [
  /^vscode\.(commands|window|workspace|env|debug|tasks)\./,
  /\.show(TextDocument|InformationMessage|WarningMessage|ErrorMessage|QuickPick|SaveDialog|InputBox)$/,
  /\.execute(Command|Task)$/,
  /\.open(TextDocument|NotebookDocument)$/,
  /\.with(Scm)?Progress$/,
  /\.asExternalUri$/
];

// Registration/creation APIs that should return a disposable
const DISPOSABLE_PATTERNS = [
  /^vscode\.(commands|languages|workspace|window|debug|tests|notebooks)\.register/,
  /\.create(TextEditorDecorationType|StatusBarItem|TreeView|QuickPick|InputBox|OutputChannel|WebviewPanel|NotebookController|RendererMessaging)$/
];

// Minimal enums you actually reference
const ENUMS = {
  'vscode.SymbolKind': [
    'File','Module','Namespace','Package','Class','Method','Property','Field','Constructor','Enum','Interface','Function','Variable','Constant','String','Number','Boolean','Array','Object','Key','Null','EnumMember','Struct','Event','Operator','TypeParameter'
  ],
  'vscode.DiagnosticSeverity': ['Error','Warning','Information','Hint'],
  'vscode.ViewColumn': ['Active','Beside','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'],
  'vscode.ColorThemeKind': ['Light','Dark','HighContrast','HighContrastLight'],
  'vscode.NotebookCellKind': ['Markup','Code']
};

const makeEnum = keys => keys.reduce((o,k)=> (o[k] = 0, o), {});
const makeDisposable = name => Object.assign(createStub(name), { dispose: () => log(`${name}.dispose()`) });
const makeThenable = name => { const p = Promise.resolve(null); p.__stubName = name; return p; };

const getReturn = path =>
  ASYNC_PATTERNS.some(rx => rx.test(path)) ? makeThenable(path) :
  DISPOSABLE_PATTERNS.some(rx => rx.test(path)) ? makeDisposable(path) :
  createStub(path);

const makeNamespace = (path = 'vscode') => new Proxy(function(){}, {
  construct(_, args) { log(`new ${path}(`, args, ')'); return createStub(path); },
  apply(_, __, args) { log(`${path}(`, args, ')'); return getReturn(path); },
  get(_, prop) {
    const full = `${path}.${String(prop)}`;
    if (ENUMS[full]) return makeEnum(ENUMS[full]);
    if (path === 'vscode' && prop === 'version') return createStub(full);
    return makeNamespace(full);
  }
});

module.exports = makeNamespace('vscode');
if (DEBUG) console.info('[vscode-stub] Dynamic stub loaded');
