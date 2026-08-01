import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

loader.config({ monaco })

monaco.editor.defineTheme('flamingo-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '949494', fontStyle: 'italic' },
    { token: 'string', foreground: '0f7b55' },
    { token: 'string.key.json', foreground: '0a0a0a' },
    { token: 'string.value.json', foreground: '0f7b55' },
    { token: 'number', foreground: '0072b2' },
    { token: 'keyword', foreground: 'a8567f' },
    { token: 'tag', foreground: '0072b2' },
    { token: 'attribute.name', foreground: 'a8567f' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#0a0a0a',
    'editorGutter.background': '#ffffff',
    'editorLineNumber.foreground': '#c4c4c4',
    'editorLineNumber.activeForeground': '#0a0a0a',
    'editor.lineHighlightBackground': '#f7f7f7',
    'editor.lineHighlightBorder': '#00000000',
    'editor.selectionBackground': '#dcdcdc',
    'editorIndentGuide.background1': '#f0f0f0',
    'editorIndentGuide.activeBackground1': '#dcdcdc',
    'editorWidget.background': '#ffffff',
    'editorWidget.border': '#ececec',
    'scrollbarSlider.background': '#dcdcdc80',
    'scrollbarSlider.hoverBackground': '#c4c4c4b0',
    'scrollbarSlider.activeBackground': '#94949480',
  },
})

monaco.editor.defineTheme('flamingo-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6d6d6d', fontStyle: 'italic' },
    { token: 'string', foreground: '35a06a' },
    { token: 'string.key.json', foreground: 'f2f2f2' },
    { token: 'string.value.json', foreground: '35a06a' },
    { token: 'number', foreground: '4a9fd8' },
    { token: 'keyword', foreground: 'cc79a7' },
    { token: 'tag', foreground: '4a9fd8' },
    { token: 'attribute.name', foreground: 'cc79a7' },
  ],
  colors: {
    'editor.background': '#0f0f0f',
    'editor.foreground': '#f2f2f2',
    'editorGutter.background': '#0f0f0f',
    'editorLineNumber.foreground': '#454545',
    'editorLineNumber.activeForeground': '#f2f2f2',
    'editor.lineHighlightBackground': '#161616',
    'editor.lineHighlightBorder': '#00000000',
    'editor.selectionBackground': '#343434',
    'editorIndentGuide.background1': '#1c1c1c',
    'editorIndentGuide.activeBackground1': '#343434',
    'editorWidget.background': '#161616',
    'editorWidget.border': '#232323',
    'scrollbarSlider.background': '#34343480',
    'scrollbarSlider.hoverBackground': '#454545b0',
    'scrollbarSlider.activeBackground': '#6d6d6d80',
  },
})
