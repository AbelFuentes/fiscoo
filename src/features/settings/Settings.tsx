import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { usePreferences } from '../../preferences/PreferencesContext';
import { toast } from '@abelfuentes/ui-controls/toast';
import {
  ACCENTS,
  DANGER_STYLE,
} from './settings.constants';
import type { UserPreferencesInput } from './userPreferences';
import { uploadUserAvatar } from './userPreferences';
import './settings.css';

type SettingsTab =
  | 'profile'
  | 'notifications'
  | 'appearance'
  | 'danger';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    preferences,
    avatarSrc,
    loading: loadingPreferences,
    updatePreferences,
  } = usePreferences();

  const email = user?.email || '';

  const [draft, setDraft] =
    useState<UserPreferencesInput | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<SettingsTab>('profile');

  const [deleteValue, setDeleteValue] =
    useState('');

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const canDelete =
    deleteValue === 'ELIMINAR';

  useEffect(() => {
    if (!preferences) {
      setDraft(null);
      return;
    }

    setDraft({
      user_id: preferences.user_id,
      first_name: preferences.first_name,
      last_name: preferences.last_name,
      bio: preferences.bio,
      language: preferences.language,
      avatar_url: preferences.avatar_url,
      theme: preferences.theme,
      accent: preferences.accent,
      email_notifications:
        preferences.email_notifications,
      push_notifications:
        preferences.push_notifications,
      mention_notifications:
        preferences.mention_notifications,
      activity_summary:
        preferences.activity_summary,
    });
  }, [preferences]);

  const updateDraft = <
    K extends keyof UserPreferencesInput,
  >(
    key: K,
    value: UserPreferencesInput[K],
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };
    });
  };

  const handleSave = async () => {
    if (!draft) {
      return;
    }

    try {
      setLoading(true);

      await updatePreferences({
        first_name: draft.first_name,
        last_name: draft.last_name,
        bio: draft.bio,
        language: draft.language,
        avatar_url: draft.avatar_url,
        accent: draft.accent,
        email_notifications:
          draft.email_notifications,
        push_notifications:
          draft.push_notifications,
        mention_notifications:
          draft.mention_notifications,
        activity_summary:
          draft.activity_summary,
      });

      toast.success(
        'Cambios guardados',
      );
    } catch (error) {
      console.error(
        'Error saving user preferences:',
        error,
      );

      toast.danger(
        'No se pudieron guardar los cambios.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = '';

    if (!file || !user || !draft) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.danger(
        'Solo puedes subir imágenes JPG, PNG o WebP.',
      );

      return;
    }

    const maxSize =
      2 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.danger(
        'La imagen no puede superar los 2 MB.',
      );

      return;
    }

    try {
      setUploadingAvatar(true);

      const avatarPath =
        await uploadUserAvatar(
          user.id,
          file,
        );

      await updatePreferences({
        avatar_url: avatarPath,
      });

      setDraft((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          avatar_url: avatarPath,
        };
      });

      toast.success(
        'Foto actualizada',
      );
    } catch (error) {
      console.error(
        'Error uploading avatar:',
        error,
      );

      toast.danger(
        'No se pudo actualizar la foto.',
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAccentChange = (
    event: Event,
  ) => {
    const target =
      event.target as HTMLElement & {
        value?: string;
      };

    const value = target.value;

    if (
      value !== 'indigo' &&
      value !== 'green' &&
      value !== 'orange'
    ) {
      return;
    }

    updateDraft(
      'accent',
      value,
    );

    const [
      accentColor,
      accentColor2,
    ] = ACCENTS[value];

    document.documentElement.style.setProperty(
      '--ui-accent',
      accentColor,
    );

    document.documentElement.style.setProperty(
      '--ui-accent-2',
      accentColor2,
    );
  };

  const handleTabChange = (
    event: Event,
  ) => {
    const customEvent =
      event as CustomEvent<{
        value?: string;
      }>;

    const value =
      customEvent.detail?.value;

    if (
      value === 'profile' ||
      value === 'notifications' ||
      value === 'appearance' ||
      value === 'danger'
    ) {
      setActiveTab(value);
    }
  };

  const handleDelete = () => {
    toast.danger(
      'Tu cuenta fue eliminada (demo)',
      {
        title: 'Cuenta eliminada',
      },
    );
  };

  if (
    loadingPreferences ||
    !draft
  ) {
    return (
      <div className="st">
        <ui-stack gap="lg">
          <div>
            <ui-button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate('/dashboard')
              }
            >
              ← Volver al resumen
            </ui-button>
          </div>

          <div>
            <h1>Ajustes</h1>
            <p>
              Cargando tus preferencias...
            </p>
          </div>
        </ui-stack>
      </div>
    );
  }

  const fullName =
    [
      draft.first_name,
      draft.last_name,
    ]
      .filter(Boolean)
      .join(' ') || email;

  const showSaveButton =
    activeTab !== 'danger';

  return (
    <div className="st">
      <ui-stack gap="lg">
        <div>
          <ui-button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate('/dashboard')
            }
          >
            ← Volver al resumen
          </ui-button>
        </div>

        <div>
          <h1>Ajustes</h1>
          <p>
            Administra tu cuenta y preferencias
          </p>
        </div>

        <ui-tabs
          value="profile"
          label="Ajustes"
          onchange={handleTabChange}
        >
          <section
            data-tab="profile"
            data-label="Perfil"
          >
            <ui-stack gap="lg">
              <div className="st-profile-header">
                <ui-avatar
                  name={fullName}
                  src={avatarSrc}
                  size="lg"
                  status="online"
                />

                <div className="st-avatar-actions">
                  <ui-button
                    variant="outline"
                    size="sm"
                    loading={uploadingAvatar}
                    onClick={handleAvatarClick}
                  >
                    Cambiar foto
                  </ui-button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <ui-grid min="14rem">
                <ui-input
                  label="Nombre"
                  value={draft.first_name}
                  onInput={(event) => {
                    const target =
                      event.currentTarget as HTMLElement & {
                        value?: string;
                      };

                    updateDraft(
                      'first_name',
                      target.value || '',
                    );
                  }}
                />

                <ui-input
                  label="Apellido"
                  value={draft.last_name}
                  onInput={(event) => {
                    const target =
                      event.currentTarget as HTMLElement & {
                        value?: string;
                      };

                    updateDraft(
                      'last_name',
                      target.value || '',
                    );
                  }}
                />

                <ui-input
                  label="Correo"
                  type="email"
                  value={email}
                  readonly
                />

                <ui-select
                  disabled
                  label="Idioma"
                  value={draft.language}
                  onchange={(event) => {
                    const target =
                      event.target as HTMLElement & {
                        value?: string;
                      };

                    const value =
                      target.value;

                    if (
                      value === 'es' ||
                      value === 'en' ||
                      value === 'pt'
                    ) {
                      updateDraft(
                        'language',
                        value,
                      );
                    }
                  }}
                >
                  <option value="es">
                    Español
                  </option>

                  <option value="en">
                    English
                  </option>

                  <option value="pt">
                    Português
                  </option>
                </ui-select>
              </ui-grid>

              <ui-textarea
                label="Biografía"
                maxlength={160}
                rows={2}
                maxrows={5}
                value={draft.bio}
                onInput={(event) => {
                  const target =
                    event.currentTarget as HTMLElement & {
                      value?: string;
                    };

                  updateDraft(
                    'bio',
                    target.value || '',
                  );
                }}
              />
            </ui-stack>
          </section>

          <section
            data-tab="notifications"
            data-label="Notificaciones"
          >
            <div>
              <div className="row">
                <div>
                  Correo
                  <small>
                    Novedades y avisos de seguridad
                  </small>
                </div>

                <ui-toggle
                  checked={
                    draft.email_notifications
                  }
                  label="Correo"
                  onchange={() =>
                    updateDraft(
                      'email_notifications',
                      !draft.email_notifications,
                    )
                  }
                />
              </div>

              <div className="row">
                <div>
                  Push
                  <small>
                    En tu navegador o móvil
                  </small>
                </div>

                <ui-toggle
                  checked={
                    draft.push_notifications
                  }
                  label="Push"
                  onchange={() =>
                    updateDraft(
                      'push_notifications',
                      !draft.push_notifications,
                    )
                  }
                />
              </div>

              <div className="row">
                <div>
                  Menciones
                  <small>
                    Cuando alguien te nombra
                  </small>
                </div>

                <ui-toggle
                  checked={
                    draft.mention_notifications
                  }
                  label="Menciones"
                  onchange={() =>
                    updateDraft(
                      'mention_notifications',
                      !draft.mention_notifications,
                    )
                  }
                />
              </div>
            </div>

            <ui-stack
              gap="sm"
              style={{
                marginTop: '1.25rem',
              }}
            >
              <strong>
                Resumen de actividad
              </strong>

              <ui-radio-group
                value={
                  draft.activity_summary
                }
                orientation="horizontal"
                label="Frecuencia"
                onchange={(event) => {
                  const target =
                    event.target as HTMLElement & {
                      value?: string;
                    };

                  const value =
                    target.value;

                  if (
                    value === 'daily' ||
                    value === 'weekly' ||
                    value === 'never'
                  ) {
                    updateDraft(
                      'activity_summary',
                      value,
                    );
                  }
                }}
              >
                <ui-radio value="daily">
                  Diario
                </ui-radio>

                <ui-radio value="weekly">
                  Semanal
                </ui-radio>

                <ui-radio value="never">
                  Nunca
                </ui-radio>
              </ui-radio-group>
            </ui-stack>
          </section>

          <section
            data-tab="appearance"
            data-label="Apariencia"
          >
            <ui-stack gap="lg">
              <ui-stack gap="sm">
                <strong>
                  Color de acento
                </strong>

                <ui-radio-group
                  value={draft.accent}
                  orientation="horizontal"
                  label="Acento"
                  onchange={
                    handleAccentChange
                  }
                >
                  <ui-radio value="indigo">
                    Índigo
                  </ui-radio>

                  <ui-radio value="green">
                    Verde
                  </ui-radio>

                  <ui-radio value="orange">
                    Naranja
                  </ui-radio>
                </ui-radio-group>
              </ui-stack>
            </ui-stack>
          </section>

          <section
            data-tab="danger"
            data-label="Cuenta"
          >
            <ui-stack gap="lg">
              <ui-alert tone="danger">
                <span slot="title">
                  Zona de peligro
                </span>

                Eliminar tu cuenta borra todos tus
                datos de forma permanente.
              </ui-alert>

              <div>
                <ui-tooltip
                  text="Esta acción esta bloqueada en el demo"
                >
                  <ui-button
                    disabled
                    style={DANGER_STYLE}
                    onClick={() => {
                      const dialog =
                        document.querySelector(
                          'ui-dialog',
                        ) as HTMLElement & {
                          show?: () => void;
                        };

                      dialog?.show?.();
                    }}
                  >
                    Eliminar cuenta
                  </ui-button>
                </ui-tooltip>
              </div>

              <ui-dialog size="sm">
                <span slot="header">
                  ¿Eliminar tu cuenta?
                </span>

                <ui-stack>
                  <span>
                    Escribe <strong>ELIMINAR</strong>{' '}
                    para confirmar.
                  </span>

                  <ui-input
                    label="Confirmación"
                    value={deleteValue}
                    onInput={(event) => {
                      const target =
                        event.currentTarget as HTMLElement & {
                          value?: string;
                        };

                      setDeleteValue(
                        target.value || '',
                      );
                    }}
                  />
                </ui-stack>

                <ui-button
                  slot="footer"
                  variant="ghost"
                  onClick={(event) => {
                    const dialog =
                      (
                        event.currentTarget as HTMLElement
                      ).closest(
                        'ui-dialog',
                      ) as HTMLElement & {
                        close?: () => void;
                      };

                    dialog?.close?.();
                  }}
                >
                  Cancelar
                </ui-button>

                <ui-button
                  slot="footer"
                  disabled={!canDelete}
                  style={DANGER_STYLE}
                  onClick={handleDelete}
                >
                  Eliminar
                </ui-button>
              </ui-dialog>
            </ui-stack>
          </section>
        </ui-tabs>

        {showSaveButton && (
          <div className="st-save-bar">
            <div>
              <strong>
                ¿Todo listo?
              </strong>

              <span>
                Guarda tus cambios para actualizar tus preferencias.
              </span>
            </div>

            <ui-button
              loading={loading}
              onClick={handleSave}
            >
              Guardar cambios
            </ui-button>
          </div>
        )}
      </ui-stack>
    </div>
  );
}
