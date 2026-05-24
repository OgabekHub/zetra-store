"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Folder, FolderOpen, FileCode, Terminal, RefreshCw, Play, Circle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileItem[];
}

export const CodePreviewer: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeFile, setActiveFile] = useState<string>('bot.py');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true
  });
  
  // Terminal states
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isTerminalRunning, setIsTerminalRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Mock project files
  const projectFiles: FileItem[] = [
    {
      name: 'src',
      type: 'directory',
      children: [
        {
          name: 'bot.py',
          type: 'file',
          content: `import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from config import BOT_TOKEN, OPENAI_API_KEY
from openai import AsyncOpenAI

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    # Botni ishga tushirish xabari
    await message.answer("Assalomu alaykum! AI yordamchi botga xush kelibsiz. Savolingizni yuboring.")

@dp.message()
async def handle_message(message: types.Message):
    # OpenAI GPT-4 API orqali javob olish
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": message.text}]
    )
    await message.answer(response.choices[0].message.content)

async def main():
    print("✔ Bot muvaffaqiyatli ishga tushdi!")
    print("✔ Telegram API bilan aloqa o'rnatildi.")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())`
        },
        {
          name: 'config.py',
          type: 'file',
          content: `import os
from dotenv import load_dotenv

load_dotenv()

# Env parametrlari
BOT_TOKEN = os.getenv("BOT_TOKEN", "7432890524:AAFs89_ZTR-demo")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-proj-zetraStoreSimulationKey")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")`
        }
      ]
    },
    {
      name: 'requirements.txt',
      type: 'file',
      content: `aiogram>=3.4.0
openai>=1.12.0
python-dotenv>=1.0.1
psycopg2-binary>=2.9.9`
    },
    {
      name: 'README.md',
      type: 'file',
      content: `# Zetra AI Telegram Bot

Ushbu loyiha Telegram Bot orqali OpenAI sun'iy intellektiga savollar berish va tezkor javob olish imkonini beradi.

## 🚀 Ishga tushirish qo'llanmasi
1. Loyiha papkasida virtual muhit yarating:
   \`\`\`bash
   python -m venv venv
   \`\`\`
2. Kerakli paketlarni o'rnating:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
3. .env fayliga bot tokenini va API kalitingizni yozing.
4. Botni ishga tushiring:
   \`\`\`bash
   python src/bot.py
   \`\`\`
`
    }
  ];

  // Helper to find file content recursively
  const findFileContent = (files: FileItem[], name: string): string => {
    for (const f of files) {
      if (f.name === name && f.type === 'file') return f.content || '';
      if (f.children) {
        const content = findFileContent(f.children, name);
        if (content) return content;
      }
    }
    return '';
  };

  const activeContent = findFileContent(projectFiles, activeFile);

  // Initial welcome message in terminal
  useEffect(() => {
    setTerminalHistory([t('code_terminal_welcome')]);
  }, [language]);

  // Scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  // Simple syntax highlighter for Python, markdown, txt
  const renderCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      // Highlight rules using simple styled HTML spans
      let html = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (activeFile.endsWith('.py')) {
        // Python Keywords
        const keywords = ['import', 'from', 'def', 'async', 'await', 'class', 'return', 'if', 'print', 'in', 'and', 'or'];
        keywords.forEach(kw => {
          const regex = new RegExp(`\\b${kw}\\b`, 'g');
          html = html.replace(regex, `<span class="text-indigo-400 font-semibold">${kw}</span>`);
        });

        // Strings
        html = html.replace(/(".*?"|'.*?')/g, '<span class="text-emerald-400">$1</span>');

        // Comments
        html = html.replace(/(#.*)$/g, '<span class="text-slate-500 italic">$1</span>');

        // Functions
        html = html.replace(/\b(\w+)(?=\()/g, '<span class="text-cyan-400">$1</span>');
      } else if (activeFile.endsWith('.md')) {
        // Markdown headers
        html = html.replace(/^(#+ .*)$/g, '<span class="text-indigo-400 font-extrabold">$1</span>');
        // Inline code blocks
        html = html.replace(/(`.*?`)/g, '<span class="text-purple-400 font-mono">$1</span>');
      }

      return (
        <div key={idx} className="flex leading-6 text-[12px] font-mono hover:bg-slate-850/40 px-3">
          <span className="w-8 text-right pr-3 select-none text-slate-600 border-r border-slate-800/80 mr-3">{idx + 1}</span>
          <span className="text-slate-300 flex-1 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html || ' ' }} />
        </div>
      );
    });
  };

  // Handle Simulated commands
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || isTerminalRunning) return;

    const command = terminalInput.trim();
    setTerminalHistory(prev => [...prev, `zetra@sandbox:~$ ${command}`]);
    setTerminalInput('');

    const cmdParts = command.toLowerCase().split(' ');
    const mainCmd = cmdParts[0];

    setIsTerminalRunning(true);

    setTimeout(() => {
      if (mainCmd === 'help') {
        setTerminalHistory(prev => [
          ...prev,
          "Mavjud buyruqlar / Available commands:",
          "  help           - Yordam oynasini ko'rsatish",
          "  ls             - Fayllar ro'yxatini chiqarish",
          "  cat <fayl>     - Fayl tarkibini ko'rish",
          "  run            - Loyihani virtual sandboxda ishga tushirish",
          "  clear          - Ekranni tozalash"
        ]);
        setIsTerminalRunning(false);
      } else if (mainCmd === 'ls') {
        setTerminalHistory(prev => [
          ...prev,
          "drwxr-xr-x   src/",
          "-rw-r--r--   requirements.txt",
          "-rw-r--r--   README.md"
        ]);
        setIsTerminalRunning(false);
      } else if (mainCmd === 'cat') {
        const target = cmdParts[1];
        if (!target) {
          setTerminalHistory(prev => [...prev, "Xatolik: cat [fayl_nomi] kiritilishi shart. Masalan: cat README.md"]);
        } else {
          // Flatten search
          let fileFound = false;
          const searchAndCat = (items: FileItem[]) => {
            for (const item of items) {
              if (item.name.toLowerCase() === target && item.type === 'file') {
                setTerminalHistory(prev => [...prev, ...item.content!.split('\n')]);
                fileFound = true;
                break;
              }
              if (item.children) searchAndCat(item.children);
            }
          };
          searchAndCat(projectFiles);
          if (!fileFound) setTerminalHistory(prev => [...prev, `Xatolik: '${target}' fayli topilmadi.`]);
        }
        setIsTerminalRunning(false);
      } else if (mainCmd === 'clear') {
        setTerminalHistory([]);
        setIsTerminalRunning(false);
      } else if (mainCmd === 'run' || command === 'python src/bot.py' || command === 'python bot.py') {
        // Run full setup log simulation
        setTerminalHistory(prev => [...prev, "⚙ Sandboxta virtual muhit faollashtirilmoqda..."]);
        
        setTimeout(() => {
          setTerminalHistory(prev => [...prev, "⚙ dependencies o'rnatilmoqda (aiogram, openai, dotenv)..."]);
          
          setTimeout(() => {
            setTerminalHistory(prev => [...prev, "⚙ Env kalitlari yuklanmoqda... ok!"]);
            
            setTimeout(() => {
              setTerminalHistory(prev => [
                ...prev,
                "Python virtual sandbox ishlamoqda: 'src/bot.py'",
                "==================================================",
                "[INFO] Connection to Telegram Servers: SUCCESS",
                "[INFO] Connection to OpenAI GPT-4 API: SECURE",
                "✔ Bot polling rejimi muvaffaqiyatli boshlandi!",
                " ",
                "Siz bot sandboxini faollashtirdingiz. Bot foydalanuvchilarni kutmoqda...",
                "Log: User @OgabekAdmin start buyrug'ini jo'natdi.",
                "Log: OpenAI API orqali javob yuborildi (Litsenziya: ZETRA-MOCK)."
              ]);
              setIsTerminalRunning(false);
            }, 1000);
          }, 800);
        }, 800);
      } else {
        setTerminalHistory(prev => [...prev, `Buyruq topilmadi: '${mainCmd}'. Yordam olish uchun 'help' deb yozing.`]);
        setIsTerminalRunning(false);
      }
    }, 200);
  };

  // Render Explorer File Node recursively
  const renderExplorerNode = (item: FileItem, depth = 0) => {
    const isDir = item.type === 'directory';
    const isExpanded = expandedFolders[item.name];

    return (
      <div key={item.name} className="select-none">
        <div
          onClick={() => isDir ? toggleFolder(item.name) : setActiveFile(item.name)}
          className={`flex items-center gap-2 py-1 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            activeFile === item.name && !isDir
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          {isDir ? (
            isExpanded ? <FolderOpen className="w-4 h-4 text-indigo-400" /> : <Folder className="w-4 h-4 text-indigo-500" />
          ) : (
            <FileCode className="w-4 h-4 text-slate-500" />
          )}
          <span>{item.name}</span>
        </div>
        
        {isDir && isExpanded && item.children && (
          <div className="space-y-0.5 mt-0.5">
            {item.children.map(child => renderExplorerNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-[380px] bg-slate-955 light:bg-slate-100 rounded-3xl border border-slate-800 light:border-slate-200 flex flex-col overflow-hidden transition-colors">
      
      {/* Editor & Folder Tree Main Area */}
      <div className="flex-1 flex min-h-0 border-b border-slate-900 light:border-slate-200">
        
        {/* Left Side: Folder Explorer */}
        <div className="w-[145px] sm:w-[170px] bg-slate-950/40 light:bg-slate-50 border-r border-slate-900 light:border-slate-200 p-3 overflow-y-auto flex flex-col gap-2">
          <span className="text-[9px] font-extrabold text-slate-500 light:text-slate-400 uppercase tracking-wider block mb-1">
            {t('code_file_tree')}
          </span>
          <div className="space-y-0.5">
            {projectFiles.map(file => renderExplorerNode(file))}
          </div>
        </div>

        {/* Right Side: Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-955 light:bg-white relative">
          
          {/* Tab Header bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900 light:border-slate-200 bg-slate-950/20 light:bg-slate-50">
            <div className="flex items-center gap-2">
              <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
              <span className="text-xs font-bold text-slate-350 light:text-slate-800 font-mono">
                {activeFile}
              </span>
            </div>
            
            <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 light:bg-indigo-50 light:text-indigo-650 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t('code_editor_title')}
            </span>
          </div>

          {/* Code Viewer body */}
          <div className="flex-1 overflow-y-auto py-3 bg-slate-955 light:bg-slate-950">
            {renderCode(activeContent)}
          </div>
        </div>
      </div>

      {/* Simulated Interactive Terminal */}
      <div className="h-[120px] bg-slate-950/90 light:bg-slate-900 border-t border-slate-900 p-3 flex flex-col gap-1 min-w-0 font-mono relative">
        <div className="flex justify-between items-center text-[9px] text-slate-500 light:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-900 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('code_terminal_title')}</span>
          </div>
          {isTerminalRunning && (
            <span className="animate-spin text-indigo-400">
              <RefreshCw className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* History Area */}
        <div className="flex-1 overflow-y-auto space-y-1 text-[10px] text-slate-400 select-text pr-1">
          {terminalHistory.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap leading-5">
              {line}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1 mt-1 border-t border-slate-900 pt-1.5">
          <span className="text-[10px] text-indigo-400 font-bold font-mono">zetra@sandbox:~$</span>
          <input
            type="text"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            disabled={isTerminalRunning}
            placeholder={t('code_terminal_placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-[10px] text-slate-200 font-mono focus:ring-0 placeholder-slate-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isTerminalRunning || !terminalInput.trim()}
            className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-indigo-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </form>
      </div>

    </div>
  );
};
