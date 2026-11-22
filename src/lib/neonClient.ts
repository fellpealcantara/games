// Neon Serverless PostgreSQL Client for Play Entertainment Platform
// Manages cloud saves, user profiles, and watch progress.

export interface CloudSave {
  id?: string;
  userId: string;
  gameId: string;
  console: string;
  saveType: 'sram' | 'state';
  saveData: string; // Base64 encoded save data
  updatedAt: string;
}

const LOCAL_SAVES_KEY = 'play_games_local_saves_v1';

function getLocalSaves(): Record<string, CloudSave> {
  try {
    const raw = localStorage.getItem(LOCAL_SAVES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalSaves(saves: Record<string, CloudSave>) {
  try {
    localStorage.setItem(LOCAL_SAVES_KEY, JSON.stringify(saves));
  } catch (err) {
    console.warn('Storage quota exceeded for local saves', err);
  }
}

export class NeonSaveManager {
  private connectionString: string;
  private isConfigured: boolean;

  constructor() {
    this.connectionString =
      (import.meta.env.VITE_NEON_DATABASE_URL as string) || '';
    this.isConfigured = Boolean(
      this.connectionString &&
        this.connectionString.includes('neon.tech') &&
        !this.connectionString.includes('password')
    );
  }

  public isNeonConnected(): boolean {
    return this.isConfigured;
  }

  public async saveGame(
    userId: string,
    gameId: string,
    consoleName: string,
    saveType: 'sram' | 'state',
    saveData: string
  ): Promise<boolean> {
    const saveKey = `${userId}_${gameId}_${saveType}`;
    const saveObj: CloudSave = {
      userId,
      gameId,
      console: consoleName,
      saveType,
      saveData,
      updatedAt: new Date().toISOString(),
    };

    // Always persist to local cache first
    const local = getLocalSaves();
    local[saveKey] = saveObj;
    setLocalSaves(local);

    // If Neon is configured, sync to Neon cloud
    if (this.isConfigured) {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(this.connectionString);
        await sql`
          INSERT INTO game_saves (user_id, game_id, console, save_type, save_data, updated_at)
          VALUES (${userId}, ${gameId}, ${consoleName}, ${saveType}, ${saveData}, NOW())
          ON CONFLICT (user_id, game_id, save_type)
          DO UPDATE SET save_data = EXCLUDED.save_data, updated_at = NOW();
        `;
        return true;
      } catch (err) {
        console.warn('Falha ao sincronizar com Neon. Salvo localmente.', err);
        return true;
      }
    }

    return true;
  }

  public async loadGame(
    userId: string,
    gameId: string,
    saveType: 'sram' | 'state'
  ): Promise<CloudSave | null> {
    const saveKey = `${userId}_${gameId}_${saveType}`;

    if (this.isConfigured) {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(this.connectionString);
        const rows = await sql`
          SELECT user_id, game_id, console, save_type, save_data, updated_at
          FROM game_saves
          WHERE user_id = ${userId} AND game_id = ${gameId} AND save_type = ${saveType}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            userId: r.user_id,
            gameId: r.game_id,
            console: r.console,
            saveType: r.save_type,
            saveData: r.save_data,
            updatedAt: r.updated_at,
          };
        }
      } catch (err) {
        console.warn('Erro ao consultar Neon, buscando save local:', err);
      }
    }

    const local = getLocalSaves();
    return local[saveKey] ?? null;
  }

  public async listUserSaves(userId: string): Promise<CloudSave[]> {
    if (this.isConfigured) {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(this.connectionString);
        const rows = await sql`
          SELECT user_id, game_id, console, save_type, save_data, updated_at
          FROM game_saves
          WHERE user_id = ${userId}
          ORDER BY updated_at DESC;
        `;
        return rows.map((r: any) => ({
          userId: r.user_id,
          gameId: r.game_id,
          console: r.console,
          saveType: r.save_type,
          saveData: r.save_data,
          updatedAt: r.updated_at,
        }));
      } catch (err) {
        console.warn('Erro ao listar saves do Neon:', err);
      }
    }

    const local = getLocalSaves();
    return Object.values(local).filter((s) => s.userId === userId);
  }
}

export const neonSaveManager = new NeonSaveManager();
