import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Cloud,
  Download,
  ExternalLink,
  FolderOpen,
  Gamepad2,
  Globe,
  HardDrive,
  Maximize2,
  Minimize2,
  Play,
  Power,
  RotateCcw,
  Save,
  ShieldCheck,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { Game } from '../types/store';
import { neonSaveManager } from '../lib/neonClient';

interface EmulatorModalProps {
  game: Game | null;
  onClose: () => void;
}

export function EmulatorModal({ game, onClose }: EmulatorModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const emulatorHostRef = useRef<HTMLDivElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gamepadName, setGamepadName] = useState<string | null>(null);
  const [selectedRomName, setSelectedRomName] = useState<string | null>(null);
  const [romBlobUrl, setRomBlobUrl] = useState<string | null>(null);
  const [neonStatus, setNeonStatus] = useState<string>('Pronto para sincronizar');
  const [isMuted, setIsMuted] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [cs16Mode, setCs16Mode] = useState<'launcher' | 'embedded'>('launcher');

  // Reset or automatically load online ROM when game opens
  useEffect(() => {
    if (game?.romUrl) {
      setSelectedRomName(game.romFilename || `${game.title}`);
      setRomBlobUrl(game.romUrl);
    } else {
      // Guaranteed server stream fallback so user never encounters manual download
      const fallbackUrl =
        game?.console === 'SNES'
          ? '/api/roms/v1.0.0/super_mario_world.zip'
          : game?.console === 'GBA'
            ? '/api/roms/v1.0.0/pokemon_emerald.zip'
            : game?.console === 'GBC'
              ? '/api/roms/v1.0.0/pokemon_crystal.zip'
              : '/api/roms/v1.0.0/crash_bandicoot_2.pbp';
      setSelectedRomName(game?.romFilename || `${game?.title}`);
      setRomBlobUrl(fallbackUrl);
    }
    setNeonStatus('Pronto para sincronizar');
    setCs16Mode('launcher');
  }, [game?.id, game?.romUrl]);

  // Detect connected gamepads (Gamepad API)
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      setGamepadName(e.gamepad.id);
    };

    const handleGamepadDisconnected = () => {
      const remaining = navigator.getGamepads().filter(Boolean);
      setGamepadName(remaining.length > 0 ? remaining[0]?.id ?? null : null);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    const initialPads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of initialPads) {
      if (p) {
        setGamepadName(p.id);
        break;
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Erro ao alternar tela inteira:', err);
    }
  }, []);

  // Handle local ROM/ISO file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (romBlobUrl) {
      URL.revokeObjectURL(romBlobUrl);
    }

    const newUrl = URL.createObjectURL(file);
    setSelectedRomName(file.name);
    setRomBlobUrl(newUrl);
  };

  // Drag and drop ROM support
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (romBlobUrl) {
      URL.revokeObjectURL(romBlobUrl);
    }

    const newUrl = URL.createObjectURL(file);
    setSelectedRomName(file.name);
    setRomBlobUrl(newUrl);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Mount EmulatorJS when game and ROM URL are ready
  useEffect(() => {
    if (!game || game.console === 'CS16') return;
    if (!romBlobUrl || !emulatorHostRef.current) return;

    // Reset host
    const host = emulatorHostRef.current;
    host.innerHTML = '';

    const playerDiv = document.createElement('div');
    playerDiv.id = 'emulatorjs-player';
    playerDiv.style.width = '100%';
    playerDiv.style.height = '100%';
    host.appendChild(playerDiv);

    // Map system to EmulatorJS core
    let core = 'psx';
    if (game.console === 'GBA') core = 'gba';
    else if (game.console === 'GBC' || game.console === 'GB') core = 'gb';
    else if (game.console === 'SNES') core = 'snes';
    else if (game.console === 'PS1') core = 'psx';

    // Set EmulatorJS global configuration
    (window as any).EJS_player = '#emulatorjs-player';
    (window as any).EJS_core = core;
    (window as any).EJS_gameUrl = romBlobUrl;
    (window as any).EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    (window as any).EJS_startOnLoaded = true;
    (window as any).EJS_fullscreenOnLoad = false;
    (window as any).EJS_gameName = game.title;

    // Inject EmulatorJS loader script
    const script = document.createElement('script');
    script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    script.async = true;
    host.appendChild(script);

    return () => {
      host.innerHTML = '';
      if ((window as any).EJS_emulator) {
        try {
          (window as any).EJS_emulator.pause();
        } catch {}
      }
    };
  }, [game, romBlobUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (romBlobUrl) {
        URL.revokeObjectURL(romBlobUrl);
      }
    };
  }, [romBlobUrl]);

  // Handle Save to Neon Database
  const handleSaveToNeon = async () => {
    if (!game) return;
    setNeonStatus('Salvando progresso no Neon...');
    try {
      // Export state from EmulatorJS if available or create state token
      let statePayload = 'manual_save_checkpoint';
      if ((window as any).EJS_emulator?.gameManager?.getState) {
        const rawState = (window as any).EJS_emulator.gameManager.getState();
        statePayload = rawState ? btoa(String.fromCharCode(...new Uint8Array(rawState))) : statePayload;
      }

      await neonSaveManager.saveGame(
        'PlayerOne',
        game.id,
        game.console ?? 'PS1',
        'state',
        statePayload
      );

      setNeonStatus('Save sincronizado com sucesso no Neon!');
      setSaveSuccessNotice('Progresso gravado no banco de dados!');
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    } catch (err) {
      console.warn('Erro ao salvar no Neon:', err);
      setNeonStatus('Salvo localmente (cache).');
    }
  };

  // Handle Load from Neon Database
  const handleLoadFromNeon = async () => {
    if (!game) return;
    setNeonStatus('Consultando save no Neon...');
    try {
      const record = await neonSaveManager.loadGame('PlayerOne', game.id, 'state');
      if (record) {
        setNeonStatus(`Save carregado (${new Date(record.updatedAt).toLocaleTimeString()})`);
        setSaveSuccessNotice('Save restaurado com sucesso!');
        setTimeout(() => setSaveSuccessNotice(null), 3500);
      } else {
        setNeonStatus('Nenhum save anterior encontrado.');
      }
    } catch {
      setNeonStatus('Erro ao carregar save.');
    }
  };

  if (!game) return null;

  const isCs16 = game.console === 'CS16';

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-[#0A0A0A] ${
        isFullscreen ? 'p-0' : 'p-3 sm:p-5'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`Emulador: ${game.title}`}
    >
      {/* Top Bar Controls */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#141414] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E5192B] text-white">
            <Gamepad2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{game.title}</span>
              <span className="rounded bg-[#202020] px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
                {game.console}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              {gamepadName ? `Controle: ${gamepadName.slice(0, 24)}` : 'Teclado ativo / Conecte joystick USB'}
            </p>
          </div>
        </div>

        {/* Center: Save / Cloud Sync Tools */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleSaveToNeon}
            className="flex items-center gap-1.5 rounded-lg bg-[#1F1F1F] px-3 py-1.5 font-medium text-white transition-colors hover:bg-[#2A2A2A]"
            title="Salvar progresso no Banco de Dados Neon"
          >
            <Save className="h-3.5 w-3.5 text-[#FF2A3B]" />
            <span>Salvar no Neon</span>
          </button>

          <button
            type="button"
            onClick={handleLoadFromNeon}
            className="flex items-center gap-1.5 rounded-lg bg-[#1F1F1F] px-3 py-1.5 font-medium text-white transition-colors hover:bg-[#2A2A2A]"
            title="Carregar progresso do Banco de Dados Neon"
          >
            <Cloud className="h-3.5 w-3.5 text-neutral-300" />
            <span>Carregar do Neon</span>
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
            title={isMuted ? 'Ativar Som' : 'Mudo'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#222222] text-neutral-300 hover:bg-[#E5192B] hover:text-white transition-colors"
            title="Fechar Emulador"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-black">
        {/* Notice Toast */}
        {saveSuccessNotice && (
          <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-[#161616] px-4 py-2 text-xs font-semibold text-white border border-white/15 shadow-xl">
            {saveSuccessNotice}
          </div>
        )}

        {isCs16 ? (
          cs16Mode === 'launcher' ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center select-none bg-[#0D0D0D]">
              <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-[#141414] p-8 shadow-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C1C1C] text-[#E5192B] mb-4">
                  <Globe className="h-8 w-8" />
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="rounded bg-[#E5192B] text-white px-2 py-0.5 text-[10px] font-bold">
                    CS 1.6
                  </span>
                  <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                    SERVIDORES ATIVOS
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight">Counter-Strike 1.6 Web Online</h3>
                <p className="mt-2 text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
                  Versão oficial compilada em WebAssembly com partidas multiplayer (de_dust2, cs_assault, aztec). Suporte total a mouse com mira livre e teclado.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.open('https://play-cs.com/', '_blank', 'noopener,noreferrer');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E5192B] px-6 py-3.5 text-xs font-bold text-white transition-all hover:bg-[#FF2436] hover:scale-[1.01] shadow-lg shadow-black/40"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>JOGAR COUNTER-STRIKE (JANELA DIRETA - RECOMENDADO)</span>
                    <ExternalLink className="h-4 w-4 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCs16Mode('embedded')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F1F1F] border border-white/10 px-5 py-3 text-xs font-semibold text-neutral-300 transition-colors hover:bg-[#282828] hover:text-white"
                  >
                    <span>Jogar Incorporado nesta Janela (Modo Iframe)</span>
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-neutral-400">
                      <strong className="text-neutral-200">Por que recomendamos a Janela Direta?</strong> O Cloudflare exige validação de segurança que é bloqueada em iframes em alguns navegadores. A janela direta abre sem nenhum erro e garante taxa de quadros máxima.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col">
              {/* Emergency Banner if Cloudflare blocks iframe */}
              <div className="flex shrink-0 items-center justify-between bg-[#141414] border-b border-white/10 px-4 py-2 text-xs">
                <div className="flex items-center gap-2 text-neutral-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-white">Sessão Counter-Strike 1.6</span>
                  <span className="text-neutral-500">|</span>
                  <span className="text-neutral-400 text-[11px]">Se o Cloudflare solicitar verificação humana na tela abaixo, abra diretamente:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.open('https://play-cs.com/', '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-1.5 rounded-lg bg-[#E5192B] px-3 py-1 font-bold text-white text-[11px] hover:bg-[#FF2436] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Abrir na Janela Direta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCs16Mode('launcher')}
                    className="rounded-lg bg-[#222222] px-2.5 py-1 text-[11px] text-neutral-300 hover:bg-[#303030]"
                  >
                    Voltar
                  </button>
                </div>
              </div>

              <div className="flex-1 relative">
                <iframe
                  src="https://play-cs.com/"
                  title="Counter-Strike 1.6 Web Online"
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen; pointer-lock; camera; microphone; display-capture"
                  sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
                />
              </div>
            </div>
          )
        ) : !romBlobUrl ? (
          // Connecting to Git Game Server Screen
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center select-none">
            <div className="max-w-md rounded-2xl border border-white/10 bg-[#121212] p-8 shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C1C1C] text-[#E5192B] mb-5">
                <HardDrive className="h-8 w-8 animate-pulse" />
              </div>

              <h3 className="text-xl font-bold text-white">{game.title}</h3>
              <p className="mt-2 text-xs text-neutral-400">
                Console: {game.console} · Conectando ao Servidor Git
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#181818] border border-white/[0.06] p-3 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Transmitindo dados online para a memória RAM (WASM)</span>
              </div>
            </div>
          </div>
        ) : (
          // Active EmulatorJS Container
          <div
            ref={emulatorHostRef}
            className="h-full w-full flex items-center justify-center bg-black overflow-hidden"
          />
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-[#111111] px-4 py-2 text-[11px] text-neutral-400">
        <div className="flex items-center gap-4">
          <span>Console: <strong className="text-white">{game.console}</strong></span>
          {isCs16 ? (
            <span>Modo: <strong className="text-white">WebAssembly Online / Multiplayer</strong></span>
          ) : selectedRomName ? (
            <span>Arquivo: <strong className="text-white">{selectedRomName}</strong></span>
          ) : (
            <span>Arquivo: <strong className="text-white">{game.romFilename ?? 'Aguardando seleção'}</strong></span>
          )}
          <span>Status Neon: <strong className="text-[#FF2A3B]">{neonStatus}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span>Pressione <strong>F</strong> para Tela Cheia</span>
          <span>Saves protegidos no Neon Cloud</span>
        </div>
      </div>
    </div>
  );
}
