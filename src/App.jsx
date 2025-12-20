import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Moon, Skull, Plus, Minus, User, History, Move, 
  Lock, Unlock, X, MessageSquare, RotateCcw, ChevronLeft, ChevronRight, Menu, Gavel,
  Check, Circle, AlertCircle, Trash2, MapPin, Download, Save
} from 'lucide-react';

const SETUP_RULES = {
  5: [3, 0, 1, 1], 6: [3, 1, 1, 1], 7: [5, 0, 1, 1], 8: [5, 1, 1, 1], 9: [5, 2, 1, 1],
  10: [7, 0, 2, 1], 11: [7, 1, 2, 1], 12: [7, 2, 2, 1], 13: [9, 0, 3, 1], 14: [9, 1, 3, 1], 15: [9, 2, 3, 1],
};

/**
 * 根據角色 ID 生成 GitHub 上的圖示連結
 * 規則：240px-PascalCaseName.png
 */
const getIconUrl = (id) => {
  // 保持現有邏輯：將底線分隔轉換為帕斯卡命名法 (e.g., fortune_teller -> FortuneTeller)
  const pascalName = id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  return `https://raw.githubusercontent.com/trolldaddy/botc_overlay/48e8573061c16d172912dc9e5aef5e07dac64a62/public/Allicon/240px-${pascalName}.png`;
};

const OFFICIAL_TRAVELERS = [
  { id: "beggar", name: "乞丐", team: "traveler", reminders: [], image: getIconUrl("beggar") },
  { id: "thief", name: "盜賊", team: "traveler", reminders: [], image: getIconUrl("thief") },
  { id: "bureaucrat", name: "官僚", team: "traveler", reminders: ["投票加重"], image: getIconUrl("bureaucrat") },
  { id: "gunslinger", name: "槍手", team: "traveler", reminders: [], image: getIconUrl("gunslinger") },
  { id: "scapegoat", name: "替罪羊", team: "traveler", reminders: [], image: getIconUrl("scapegoat") },
  { id: "apprentice", name: "學徒", team: "traveler", reminders: [], image: getIconUrl("apprentice") },
  { id: "matron", name: "老婦人", team: "traveler", reminders: [], image: getIconUrl("matron") },
  { id: "judge", name: "法官", team: "traveler", reminders: [], image: getIconUrl("judge") },
  { id: "bishop", name: "主教", team: "traveler", reminders: [], image: getIconUrl("bishop") },
  { id: "harlot", name: "妓女", team: "traveler", reminders: [], image: getIconUrl("harlot") },
];

const DEFAULT_SCRIPT = [
  { id: "investigator", name: "調查員", team: "townsfolk", reminders: ["爪牙", "錯誤"], image: getIconUrl("investigator") },
  { id: "washerwoman", name: "洗衣婦", team: "townsfolk", reminders: ["村民", "錯誤"], image: getIconUrl("washerwoman") },
  { id: "librarian", name: "圖書管理員", team: "townsfolk", reminders: ["外來者", "錯誤"], image: getIconUrl("librarian") },
  { id: "chef", name: "廚師", team: "townsfolk", reminders: [], image: getIconUrl("chef") },
  { id: "empath", name: "共情者", team: "townsfolk", reminders: [], image: getIconUrl("empath") },
  { id: "fortune_teller", name: "占卜師", team: "townsfolk", reminders: ["宿敵"], image: getIconUrl("fortune_teller") },
  { id: "undertaker", name: "喪葬業者", team: "townsfolk", reminders: ["今日死亡"], image: getIconUrl("undertaker") },
  { id: "monk", name: "僧侶", team: "townsfolk", reminders: ["受保護"], image: getIconUrl("monk") },
  { id: "virgin", name: "貞潔者", team: "townsfolk", reminders: ["失去能力"], image: getIconUrl("virgin") },
  { id: "slayer", name: "殺手", team: "townsfolk", reminders: ["失去能力"], image: getIconUrl("slayer") },
  { id: "soldier", name: "士兵", team: "townsfolk", reminders: [], image: getIconUrl("soldier") },
  { id: "mayor", name: "市長", team: "townsfolk", reminders: [], image: getIconUrl("mayor") },
  { id: "butler", name: "管家", team: "outsider", reminders: ["主人"], image: getIconUrl("butler") },
  { id: "drunk", name: "酒鬼", team: "outsider", reminders: [], image: getIconUrl("drunk") },
  { id: "recluse", name: "隱士", team: "outsider", reminders: [], image: getIconUrl("recluse") },
  { id: "saint", name: "聖徒", team: "outsider", reminders: [], image: getIconUrl("saint") },
  { id: "poisoner", name: "下毒者", team: "minion", reminders: ["中毒"], image: getIconUrl("poisoner") },
  { id: "spy", name: "間諜", team: "minion", reminders: [], image: getIconUrl("spy") },
  { id: "scarlet_woman", name: "猩紅女郎", team: "minion", reminders: ["惡魔"], image: getIconUrl("scarlet_woman") },
  { id: "baron", name: "男爵", team: "minion", reminders: [], image: getIconUrl("baron") },
  { id: "imp", name: "小惡魔", team: "demon", reminders: [], image: getIconUrl("imp") }
];

const COMMON_STATUS_TOKENS = [
  { id: 'dead', label: '死亡', icon: '💀', color: 'bg-gray-800' },
  { id: 'vote', label: '已投票', icon: '✋', color: 'bg-yellow-600' },
  { id: 'good', label: '善良', icon: '😇', color: 'bg-blue-600' },
  { id: 'evil', label: '邪惡', icon: '😈', color: 'bg-red-700' },
];

const App = () => {
  const [playerCount, setPlayerCount] = useState(8);
  const [players, setPlayers] = useState([]);
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [gamePhase, setGamePhase] = useState({ day: 0, time: 'setup' });
  const [logs, setLogs] = useState([]);
  const [logInput, setLogInput] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [touchDragItem, setTouchDragItem] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isDraggingPlayer, setIsDraggingPlayer] = useState(null);
  const [showTravelerMenu, setShowTravelerMenu] = useState(false);
  const fileInputRef = useRef(null);
  
  const [nominationState, setNominationState] = useState({ 
    nominator: null, 
    target: null, 
    active: false,
    willExecute: false 
  });
  
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  const containerRef = useRef(null);

  const getInitialPosition = (index, total) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 35; 
    return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
  };

  const initializePlayers = (count) => {
    const newPlayers = Array.from({ length: count }, (_, i) => {
      const pos = getInitialPosition(i, count);
      return { 
        id: Date.now() + i, 
        name: `玩家 ${i + 1}`, 
        role: null, 
        isDead: false, 
        hasGhostVote: true, 
        tokens: [], 
        x: pos.x, 
        y: pos.y,
        hasNominatedToday: false, 
        hasVotedToday: false,
        isTraveler: false
      };
    });
    setPlayers(newPlayers);
    setPlayerCount(count);
  };

  useEffect(() => { initializePlayers(8); }, []);

  const addLog = (type, content) => {
    const timestamp = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const phaseLabel = gamePhase.time === 'setup' ? '設置' : `第 ${gamePhase.day} ${gamePhase.time === 'night' ? '夜' : '日'}`;
    setLogs(prev => [{ id: Date.now() + Math.random(), time: timestamp, phase: phaseLabel, type, content }, ...prev]);
  };

  const deleteLog = (logId) => {
    setLogs(prev => prev.filter(log => log.id !== logId));
  };

  const exportLogs = () => {
    if (logs.length === 0) return;
    const content = logs
      .map(log => `[${log.time}] (${log.phase}) ${log.content}`)
      .reverse()
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `血染日誌_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePhaseChange = () => {
    let nextPhase = { ...gamePhase };
    if (gamePhase.time === 'setup') {
      nextPhase = { day: 1, time: 'night' };
      addLog('phase', '--- 遊戲正式開始 ---');
    } else if (gamePhase.time === 'night') {
      nextPhase = { day: gamePhase.day, time: 'day' };
      addLog('phase', `--- 第 ${gamePhase.day} 天天亮 ---`);
    } else {
      nextPhase = { day: gamePhase.day + 1, time: 'night' };
      addLog('phase', `--- 第 ${nextPhase.day} 夜入夜 ---`);
      setPlayers(prev => prev.map(p => ({ ...p, hasNominatedToday: false, hasVotedToday: false })));
    }
    setGamePhase(nextPhase);
    setNominationState({ nominator: null, target: null, active: false, willExecute: false });
  };

  const handleDragStart = (e, type, data) => {
    setDraggedItem({ type, data });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, data }));
  };

  const startTouchDrag = (type, data) => {
    const dragData = { type, data };
    setDraggedItem(dragData);
    setTouchDragItem(dragData);

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const playerEl = el?.closest?.('[data-player-id]');
      if (playerEl) {
        const targetId = Number(playerEl.dataset.playerId);
        performDrop(targetId, dragData.type, dragData.data);
      }
      setTouchDragItem(null);
      setDraggedItem(null);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchend', handleTouchEnd, { passive: false });
  };

  const performDrop = (targetPlayerId, type, data) => {
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;

    if (type === 'nomination_trigger') {
      const nominator = players.find(p => p.id === data.fromId);
      if (!nominator || nominator.id === targetPlayerId) return; 
      setPlayers(prev => prev.map(p => p.id === nominator.id ? { ...p, hasNominatedToday: true } : p));
      setNominationState({ nominator: nominator.id, target: targetPlayerId, active: true, willExecute: false });
    } else if (type === 'role') {
      setPlayers(players.map(p => p.id === targetPlayerId ? { ...p, role: data, isTraveler: data.team === 'traveler' } : p));
      addLog('action', `${targetPlayer.name} 分配為 [${data.name}]${data.team === 'traveler' ? ' (旅行者)' : ''}`);
    } else if (type === 'status' || type === 'reminder') {
      if (data.id === 'dead') {
        const isNowDead = !targetPlayer.isDead;
        setPlayers(players.map(p => p.id === targetPlayerId ? { ...p, isDead: isNowDead } : p));
        addLog('action', `${targetPlayer.name} ${isNowDead ? '死亡' : '復活'}`);
      } else {
        const tokenId = `${type}_${data.label}_${Date.now()}`;
        const tokenData = { id: tokenId, label: data.label, icon: data.icon || '📌', sourceImage: type === 'reminder' ? data.sourceImage : null, color: data.color || 'bg-orange-700', isReminder: type === 'reminder' };
        setPlayers(players.map(p => p.id === targetPlayerId ? { ...p, tokens: [...p.tokens, tokenData] } : p));
        addLog('action', `對 ${targetPlayer.name} 添加標記 [${data.label}]`);
      }
    }
    setDraggedItem(null);
  };

  const handleDrop = (e, targetPlayerId) => {
    e.preventDefault();
    if (!draggedItem) return;
    performDrop(targetPlayerId, draggedItem.type, draggedItem.data);
  };

  const handleContainerMouseMove = (e) => {
    if (isDraggingPlayer === null || !containerRef.current || isLocked) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlayers(prev => prev.map(p => p.id === isDraggingPlayer ? { ...p, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : p));
  };

  const handlePlayerMouseDown = (e, playerId) => {
    if (isLocked) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    setIsDraggingPlayer(playerId);
    e.preventDefault();
  };

  const addTraveler = (travelerRole) => {
    const newTraveler = {
      id: Date.now(),
      name: `旅行者 ${players.filter(p=>p.isTraveler).length + 1}`,
      role: travelerRole,
      isDead: false,
      hasGhostVote: true,
      tokens: [],
      x: 10, 
      y: 15 + (players.filter(p=>p.isTraveler).length * 10),
      hasNominatedToday: false,
      hasVotedToday: false,
      isTraveler: true
    };
    setPlayers(prev => [...prev, newTraveler]);
    addLog('action', `添加旅行者：${travelerRole.name}`);
    setShowTravelerMenu(false);
  };

  const removePlayer = (id) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    setPlayers(prev => prev.filter(p => p.id !== id));
    addLog('action', `移除了 ${player.isTraveler ? '旅行者' : '玩家'}: ${player.name}`);
  };

  const togglePlayerVote = (playerId) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        if (p.isDead && !p.hasGhostVote) return p;
        const hasVoteToken = p.tokens.some(t => t.label === '已投票');
        if (hasVoteToken) {
          return { ...p, tokens: p.tokens.filter(t => t.label !== '已投票') };
        } else {
          const voteToken = { id: `status_vote_${Date.now()}`, label: '已投票', icon: '✋', color: 'bg-yellow-600', isReminder: false };
          return { ...p, tokens: [...p.tokens, voteToken] };
        }
      }
      return p;
    }));
  };

  const finalizeNomination = () => {
    const nominator = players.find(p => p.id === nominationState.nominator);
    const target = players.find(p => p.id === nominationState.target);
    const voters = players.filter(p => p.tokens.some(t => t.label === '已投票'));
    const voteCount = voters.length;
    
    let logContent = `⚖️ 提名結算：${nominator.name} 提名 ${target.name}，獲得 ${voteCount} 票。`;
    
    setPlayers(pArr => pArr.map(p => {
      const isVoting = p.tokens.some(t => t.label === '已投票');
      const shouldConsumeGhostVote = isVoting && p.isDead && p.hasGhostVote;
      let updatedTokens = p.tokens.filter(t => t.label !== '已投票');
      if (p.id === target.id && nominationState.willExecute) {
        const executionToken = { id: `status_exec_${Date.now()}`, label: '上處決台', icon: '💀', color: 'bg-red-900', isReminder: false };
        updatedTokens = [...updatedTokens.filter(t=>t.label!=='上處決台'), executionToken];
      }
      return { 
        ...p, 
        tokens: updatedTokens,
        hasGhostVote: shouldConsumeGhostVote ? false : p.hasGhostVote,
        hasVotedToday: isVoting ? true : p.hasVotedToday
      };
    }));

    if (nominationState.willExecute) logContent += ` (💀 已列入處決名單)`;
    else logContent += ` (未達處決門檻)`;
    
    addLog('action', logContent);
    setNominationState({ nominator: null, target: null, active: false, willExecute: false });
  };

  const getTeamColor = (team) => {
    switch (team) {
      case 'townsfolk': return 'border-blue-500 bg-blue-900/80 text-blue-50';
      case 'outsider': return 'border-blue-300 bg-blue-800/60 text-blue-50'; 
      case 'minion': return 'border-red-500 bg-red-900/80 text-red-50';
      case 'demon': return 'border-red-700 bg-red-950/90 text-red-100';
      case 'traveler': return 'border-purple-500 bg-purple-900/80 text-purple-50';
      default: return 'border-slate-700 bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-[100] shrink-0 shadow-2xl relative">
        <div className="flex items-center gap-2">
          {/* 漢堡選單 */}
          <button 
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} 
            className={`p-2 rounded-lg transition-colors ${leftSidebarOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Moon size={18} className="text-indigo-400 fill-indigo-400/20 hidden sm:block" />
            <h1 className="font-black text-lg tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent hidden lg:block">拉普拉斯血染助手 🌙</h1>
          </div>
          
          {!nominationState.active && gamePhase.time === 'setup' && (
            <div className="flex items-center gap-2 ml-2 bg-black/40 px-3 py-1 rounded-xl border border-slate-800">
              <button onClick={() => {
                const newCount = Math.max(5, playerCount - 1);
                initializePlayers(newCount);
              }} className="p-1 hover:bg-slate-700 rounded text-slate-400"><Minus size={12}/></button>
              <span className="text-sm font-black w-6 text-center">{playerCount}</span>
              <button onClick={() => {
                const newCount = Math.min(15, playerCount + 1);
                initializePlayers(newCount);
              }} className="p-1 hover:bg-slate-700 rounded text-slate-400"><Plus size={12}/></button>
            </div>
          )}

          {!nominationState.active && gamePhase.time !== 'setup' && (
            <button 
              onClick={() => setShowTravelerMenu(!showTravelerMenu)}
              className="flex items-center gap-2 bg-purple-900/40 hover:bg-purple-800/60 px-4 py-1.5 rounded-xl border border-purple-500/30 text-xs font-black text-purple-300 transition-all ml-2"
            >
              <MapPin size={14} /> 旅行者
            </button>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-1.5 rounded-xl border border-slate-700 text-xs font-black text-slate-200 transition-all ml-2"
          >
            <Upload size={14} /> 載入劇本
          </button>
          <input 
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const json = JSON.parse(text);
                const candidate = Array.isArray(json) ? json : json.script;
                if (!Array.isArray(candidate)) throw new Error('格式錯誤，需為陣列或包含 script 陣列');
                const normalized = candidate.map((item, idx) => {
                  if (!item.name || !item.team) throw new Error(`第 ${idx + 1} 筆缺少 name 或 team`);
                  return {
                    id: item.id || `custom_${idx}`,
                    name: item.name,
                    team: item.team,
                    reminders: item.reminders || [],
                    image: item.image || getIconUrl(item.id || item.name.replace(/\s+/g, '_'))
                  };
                });
                setScript(normalized);
                addLog('action', `已載入自訂劇本：${file.name} (${normalized.length} 角色)`);
              } catch (err) {
                alert(`載入劇本失敗：${err.message}`);
              } finally {
                e.target.value = '';
              }
            }}
          />
        </div>

        {nominationState.active && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 bg-slate-800/90 border border-yellow-600/50 rounded-2xl px-6 py-1.5 shadow-[0_0_20px_rgba(202,138,4,0.3)] animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-indigo-400">{players.find(p=>p.id===nominationState.nominator)?.name}</span>
              <Gavel size={14} className="text-yellow-500" />
              <span className="text-xs font-black text-red-400">{players.find(p=>p.id===nominationState.target)?.name}</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={nominationState.willExecute} onChange={(e)=>setNominationState({...nominationState, willExecute: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-0" />
                <span className={`text-[11px] font-bold ${nominationState.willExecute ? 'text-red-500' : 'text-slate-400'}`}>上處決台</span>
              </label>
              <button onClick={finalizeNomination} className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5">
                <Check size={14}/> 結算 ({players.filter(p => p.tokens.some(t => t.label === '已投票')).length})
              </button>
              <button onClick={() => setNominationState({nominator:null, target:null, active:false, willExecute:false})} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400"><X size={16}/></button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!nominationState.active && (
            <div className="flex items-center bg-black/40 rounded-xl px-1.5 py-1 border border-slate-800">
              <span className={`px-2 text-[10px] font-black ${gamePhase.time === 'night' ? 'text-purple-400' : 'text-yellow-400'}`}>
                {gamePhase.time === 'setup' ? '設置' : `D${gamePhase.day}${gamePhase.time === 'night' ? '夜' : '日'}`}
              </span>
              <button onClick={handlePhaseChange} className="px-2 py-0.5 hover:bg-slate-700 rounded-lg text-[10px] bg-slate-800 font-bold uppercase transition-colors">Next</button>
            </div>
          )}
          <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-lg transition-all ${isLocked ? 'text-slate-500 bg-slate-800' : 'bg-indigo-600 text-white'}`}><Lock size={18} /></button>
          <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={`p-2 rounded-lg transition-colors ${rightSidebarOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><History size={20} /></button>
        </div>
      </header>

      {showTravelerMenu && (
        <div className="absolute top-16 left-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-2 z-[200] w-64 animate-in fade-in zoom-in-95">
          <div className="col-span-2 text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest px-1">選取旅行者角色</div>
          {OFFICIAL_TRAVELERS.map(t => (
            <button key={t.id} onClick={() => addTraveler(t)} className="flex flex-col items-center p-2 rounded-xl hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30 transition-all group">
              <img src={t.image} className="w-10 h-10 object-contain mb-1" alt="" onError={(e) => e.target.style.display='none'} />
              <span className="text-[10px] font-bold text-slate-300">{t.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* 左側欄：優化過渡動畫與 overflow 處理 */}
        <aside 
          className={`bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20 transition-all duration-300 ease-in-out overflow-hidden ${leftSidebarOpen ? 'w-[420px]' : 'w-0 border-r-0'}`}
        >
          <div className="w-[420px] h-full flex flex-col">
            <div className="p-4 bg-black/20 font-black flex items-center justify-between gap-2 text-xs text-slate-500 tracking-widest uppercase border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2"><User size={14} /> 角色與標記</div>
              <button onClick={() => setLeftSidebarOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronLeft size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
              {['townsfolk', 'outsider', 'minion', 'demon'].map(team => (
                <div key={team}>
                  <h3 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest border-l-4 border-slate-700 pl-2">
                    {team === 'townsfolk' ? '鎮民' : team === 'outsider' ? '外來者' : team === 'minion' ? '爪牙' : '惡魔'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {script.filter(r => r.team === team).map(role => (
                      <div key={role.id} className={`flex rounded-2xl border-2 overflow-hidden shadow-xl ${getTeamColor(team)} bg-slate-900/50 backdrop-blur-sm`}>
                        <div 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'role', role)} 
                          onTouchStart={() => startTouchDrag('role', role)}
                          className="w-1/2 p-3 flex flex-col items-center justify-center border-r border-slate-800/50 cursor-grab hover:bg-white/5 transition-colors"
                        >
                          <div className="w-12 h-12 flex items-center justify-center mb-1">
                            {role.image ? <img src={role.image} className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]" alt={role.name} /> : <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-[10px]">?</div>}
                          </div>
                          <span className="font-black text-[11px] text-center leading-tight truncate w-full">{role.name}</span>
                        </div>
                        <div className="w-1/2 p-2 bg-black/40 flex flex-col gap-1.5 overflow-y-auto max-h-[110px]">
                          {role.reminders?.map((reminder, idx) => (
                            <div 
                              key={idx} 
                              draggable 
                              onDragStart={(e) => handleDragStart(e, 'reminder', { label: reminder, color: 'bg-orange-800', sourceImage: role.image })} 
                              onTouchStart={() => startTouchDrag('reminder', { label: reminder, color: 'bg-orange-800', sourceImage: role.image })}
                              className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg cursor-grab hover:bg-orange-900/40 text-slate-300 flex items-center gap-2 transition-all"
                            >
                              {role.image ? <img src={role.image} className="w-3.5 h-3.5 object-contain" alt="" /> : <span>📌</span>}
                              <span className="truncate">{reminder}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 主遊戲畫布：現在會根據側邊欄狀態自動撐開 */}
        <main 
          ref={containerRef} 
          onMouseMove={handleContainerMouseMove} 
          onMouseUp={() => setIsDraggingPlayer(null)} 
          className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center transition-all duration-300 ease-in-out"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111827_0%,_#020617_100%)]" />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 p-4 rounded-3xl border border-slate-800 shadow-2xl flex gap-4 backdrop-blur">
            {COMMON_STATUS_TOKENS.map(token => (
              <div 
                key={token.id} 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'status', token)} 
                onTouchStart={() => startTouchDrag('status', token)}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl cursor-grab hover:scale-110 transition-all border border-white/5 ${token.color}`}
              >
                <span className="text-2xl">{token.icon}</span>
                <span className="text-[9px] mt-1 font-black opacity-60 uppercase">{token.label}</span>
              </div>
            ))}
          </div>

          <div className="absolute inset-0">
            {players.map((player) => {
              const isRightSide = player.x > 50;
              const startAngle = isRightSide ? (Math.PI + Math.PI / 4) : (-Math.PI / 4); 
              const spacing = isRightSide ? (-Math.PI / 6.5) : (Math.PI / 6.5);
              
              return (
                  <div 
                    key={player.id} 
                    data-player-id={player.id}
                    style={{ left: `${player.x}%`, top: `${player.y}%` }} 
                    onMouseDown={(e) => handlePlayerMouseDown(e, player.id)} 
                    onDrop={(e) => handleDrop(e, player.id)} 
                    onDragOver={(e) => e.preventDefault()} 
                    className={`absolute w-36 h-36 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 ${isDraggingPlayer === player.id ? 'z-[90]' : 'z-10'}`}
                  >
                  
                  {player.tokens.map((t, idx) => (
                    <button 
                      key={t.id} 
                      onClick={(e) => { e.stopPropagation(); setPlayers(pArr => pArr.map(p => p.id === player.id ? {...p, tokens: p.tokens.filter(tk => tk.id !== t.id)} : p)); }} 
                      style={{ transform: `translate(${(72 * Math.cos(startAngle + (idx * spacing)))}px, ${(72 * Math.sin(startAngle + (idx * spacing)))}px)`, zIndex: 100 }} 
                      className={`absolute text-[10px] px-2 py-1 rounded-full shadow-2xl text-white font-black hover:bg-red-600 transition-all border border-white/10 flex items-center gap-2 ${t.color}`}
                    >
                      {t.sourceImage ? <img src={t.sourceImage} className="w-4 h-4 object-contain" alt="" /> : <span className="text-xs">{t.icon}</span>}
                      <span className="max-w-[60px] truncate uppercase">{t.label}</span>
                    </button>
                  ))}

                  {isLocked && !nominationState.active && !player.hasNominatedToday && !player.isDead && (
                    <div 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, 'nomination_trigger', { fromId: player.id })} 
                      onTouchStart={() => startTouchDrag('nomination_trigger', { fromId: player.id })}
                      className="absolute -top-6 bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 cursor-grab z-50 hover:scale-110 transition-transform"
                    >
                      <span className="text-sm">📣</span>
                    </div>
                  )}

                  {!isLocked && (
                    <button onClick={() => removePlayer(player.id)} className="absolute -top-6 -right-6 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg z-[100] hover:bg-red-500 transition-all"><Trash2 size={14} /></button>
                  )}

                  <div onClick={() => nominationState.active && togglePlayerVote(player.id)} className={`relative w-full h-full rounded-full border-2 shadow-2xl flex flex-col items-center justify-between py-4 px-3 bg-slate-900 transition-all duration-500 ${nominationState.target === player.id ? 'ring-4 ring-red-500 scale-105' : nominationState.nominator === player.id ? 'ring-4 ring-indigo-500 scale-105' : ''} ${player.isDead ? 'grayscale brightness-50 bg-slate-950' : player.role ? getTeamColor(player.role.team) : 'border-slate-800'}`}>
                    <div className="h-4 w-full flex items-center justify-center z-10">
                      {player.role && <div className="font-black text-[11px] uppercase tracking-wider truncate px-1 text-white">{player.role.name}</div>}
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center">
                      {player.role && player.role.image ? <img src={player.role.image} className="w-20 h-20 object-contain z-10" alt="" /> : <div className="text-4xl opacity-5 font-black">?</div>}
                    </div>
                    <div className="h-7 w-full px-1 z-10">
                      <input type="text" value={player.name} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => setPlayers(prev => prev.map(p => p.id === player.id ? {...p, name: e.target.value} : p))} className="w-full bg-black/40 rounded-lg text-center text-[11px] py-1 outline-none border border-transparent focus:border-white/20 transition-all text-slate-100 font-bold"/>
                    </div>
                    
                    {player.isDead && (
                      <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setPlayers(prev => prev.map(p => p.id === player.id ? {...p, hasGhostVote: !p.hasGhostVote} : p))} className={`absolute -bottom-4 px-4 py-1.5 rounded-full text-[9px] font-black border shadow-2xl transition-all z-50 ${player.hasGhostVote ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
                        {player.hasGhostVote ? '鬼魂投票(1)' : '已用鬼票'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* 右側欄：日誌 */}
        <aside 
          className={`bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-20 transition-all duration-300 ease-in-out overflow-hidden ${rightSidebarOpen ? 'w-80' : 'w-0 border-l-0'}`}
        >
          <div className="w-80 h-full flex flex-col">
            <div className="p-4 bg-black/20 font-black flex items-center justify-between gap-2 text-xs text-slate-500 tracking-widest uppercase border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2"><History size={14} /> 遊戲日誌</div>
              <div className="flex gap-1">
                <button onClick={exportLogs} title="匯出日誌" className="p-1 hover:bg-slate-800 rounded text-slate-400 transition-colors"><Download size={16} /></button>
                <button onClick={() => setRightSidebarOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight size={18} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px]">
              {logs.length === 0 && <div className="text-slate-600 italic text-center py-10">尚無記錄...</div>}
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-black/30 border border-slate-800 flex flex-col gap-1.5 hover:bg-black/50 group relative">
                  <button 
                    onClick={() => deleteLog(log.id)} 
                    className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="刪除紀錄"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="flex justify-between items-center opacity-50 font-black text-[9px]">
                    <span>{log.time}</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded-full text-indigo-400 uppercase">{log.phase}</span>
                  </div>
                  <div className={`${log.type === 'action' && log.content.includes('⚖️') ? 'text-yellow-400 font-bold' : log.type === 'phase' ? 'text-indigo-300 font-black border-l-2 border-indigo-500 pl-2' : 'text-slate-300'} pr-6`}>
                    {log.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-black/20 border-t border-slate-800 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); if(logInput) { addLog('note', logInput); setLogInput(""); } }} className="flex gap-2">
                <input type="text" value={logInput} onChange={(e) => setLogInput(e.target.value)} placeholder="手動筆記..." className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500" />
                <button type="submit" className="bg-indigo-600 p-2.5 rounded-xl text-white hover:bg-indigo-500 transition-colors"><MessageSquare size={16} /></button>
              </form>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;
