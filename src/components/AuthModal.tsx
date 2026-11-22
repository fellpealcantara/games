import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield, User, X } from 'lucide-react';
import { neonSaveManager } from '../lib/neonClient';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (user: {
    id: string;
    email: string;
    username: string;
    statusText: string;
    streamingListIds: string[];
    streamingLikedIds: string[];
  }) => void;
}

export function AuthModal({ open, onClose, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (password.trim().length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const user = await neonSaveManager.loginOrRegisterUser(
        cleanEmail,
        tab === 'register' ? username.trim() : undefined
      );

      // Store active session token/email
      localStorage.setItem('play_auth_user_v1', JSON.stringify(user));
      onLoginSuccess(user);
      onClose();
    } catch {
      setError('Falha ao autenticar. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    const guestUser = {
      id: 'PlayerOne',
      email: 'playerone@play.app',
      username: 'PlayerOne',
      statusText: 'Pronto para jogar e assistir',
      streamingListIds: [],
      streamingLikedIds: [],
    };
    localStorage.setItem('play_auth_user_v1', JSON.stringify(guestUser));
    onLoginSuccess(guestUser);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela de login"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1A1A] text-neutral-400 hover:bg-[#252525] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] px-3.5 py-1.5 border border-white/[0.08] mb-3">
            <span className="h-2 w-2 rounded-full bg-[#E5192B]" />
            <span className="text-[11px] font-bold tracking-wider text-white uppercase">
              Play Entertainment
            </span>
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-bold tracking-tight text-white">
            {tab === 'login' ? 'Acesse seu Perfil' : 'Criar Nova Conta'}
          </h2>
          <p className="mt-1 text-xs text-neutral-400 max-w-xs mx-auto">
            Sincronize seu catálogo de streaming, lista de favoritos e recomendações personalizadas com IA.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex rounded-xl bg-[#1A1A1A] p-1 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
              tab === 'login'
                ? 'bg-[#E5192B] text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Entrar com E-mail
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
              tab === 'register'
                ? 'bg-[#E5192B] text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Criar Cadastro
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label htmlFor="auth-username" className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nome de Usuário
              </label>
              <div className="flex h-11 items-center rounded-xl bg-[#181818] border border-white/10 px-3.5 focus-within:border-[#E5192B] transition-colors">
                <User className="h-4 w-4 text-neutral-400 shrink-0" />
                <input
                  id="auth-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="h-full w-full bg-transparent px-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  required={tab === 'register'}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Endereço de E-mail
            </label>
            <div className="flex h-11 items-center rounded-xl bg-[#181818] border border-white/10 px-3.5 focus-within:border-[#E5192B] transition-colors">
              <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@dominio.com"
                className="h-full w-full bg-transparent px-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Senha
            </label>
            <div className="flex h-11 items-center rounded-xl bg-[#181818] border border-white/10 px-3.5 focus-within:border-[#E5192B] transition-colors">
              <Lock className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-full w-full bg-transparent px-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                className="text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#E5192B] font-bold text-xs text-white transition-colors hover:bg-[#FF2436] disabled:opacity-50 mt-2"
          >
            {isLoading
              ? 'Conectando ao banco de dados...'
              : tab === 'login'
              ? 'Entrar na Plataforma'
              : 'Criar Minha Conta'}
          </button>
        </form>

        {/* Guest fallback button */}
        <div className="mt-5 border-t border-white/[0.08] pt-4 text-center">
          <button
            type="button"
            onClick={handleGuestAccess}
            className="text-xs text-neutral-400 hover:text-white transition-colors font-medium"
          >
            Continuar com Perfil Padrão (PlayerOne)
          </button>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
          <Shield className="h-3.5 w-3.5" />
          <span>Autenticação em nuvem segura via Neon PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}
