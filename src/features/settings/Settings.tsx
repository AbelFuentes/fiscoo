import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { toast } from '@abelfuentes/ui-controls/toast';
import {
  ACCENTS,
  DANGER_STYLE,
} from './settings.constants';
import './settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    '';

  const nameParts = fullName.trim().split(/\s+/);

  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const email = user?.email || '';

  const [loading, setLoading] = useState(false);
  const [deleteValue, setDeleteValue] = useState('');

  const canDelete = deleteValue === 'ELIMINAR';

  const handleSave = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      toast.success('Cambios guardados');
    }, 900);
  };

  const handleThemeChange = (event: Event) => {
    const target = event.target as HTMLElement & {
      value?: string;
    };

    const value = target.value;

    if (value === 'light' || value === 'dark') {
      document.documentElement.dataset.theme = value;
      document.documentElement.style.colorScheme = value;
      localStorage.setItem('ui-theme', value);
    }
  };

  const handleAccentChange = (event: Event) => {
    const target = event.target as HTMLElement & {
      value?: keyof typeof ACCENTS;
    };

    const value = target.value;

    if (!value || !ACCENTS[value]) {
      return;
    }

    const [accent, accent2] = ACCENTS[value];

    document.documentElement.style.setProperty(
      '--ui-accent',
      accent,
    );

    document.documentElement.style.setProperty(
      '--ui-accent-2',
      accent2,
    );
  };

  const handleDelete = () => {
    toast.danger(
      'Tu cuenta fue eliminada (demo)',
      {
        title: 'Cuenta eliminada',
      },
    );
  };

  return (
    <div className="st">
      <ui-stack gap="lg">
        <div>
          <ui-button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
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
        >
          <section
            data-tab="profile"
            data-label="Perfil"
          >
            <ui-stack gap="lg">
              <div className="st-profile-header">
                <ui-avatar
                  name={fullName || email}
                  size="lg"
                  status="online"
                />

                <ui-button
                  variant="outline"
                  size="sm"
                >
                  Cambiar foto
                </ui-button>
              </div>

              <ui-grid min="14rem">
                <ui-input
                  label="Nombre"
                  value={firstName}
                />

                <ui-input
                  label="Apellido"
                  value={lastName}
                />

                <ui-input
                  label="Correo"
                  type="email"
                  value={email}
                />

                <ui-select
                  label="Idioma"
                  value="es"
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
                autosize
                rows={2}
                maxrows={5}
                hint="Aparece en tu perfil público"
              />

              <div className="actions">
                <ui-button variant="ghost">
                  Cancelar
                </ui-button>

                <ui-button
                  loading={loading}
                  onClick={handleSave}
                >
                  Guardar cambios
                </ui-button>
              </div>
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
                  checked
                  label="Correo"
                />
              </div>

              <div className="row">
                <div>
                  Push
                  <small>
                    En tu navegador o móvil
                  </small>
                </div>

                <ui-toggle label="Push" />
              </div>

              <div className="row">
                <div>
                  Menciones
                  <small>
                    Cuando alguien te nombra
                  </small>
                </div>

                <ui-toggle
                  checked
                  label="Menciones"
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
                value="weekly"
                orientation="horizontal"
                label="Frecuencia"
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
              <div className="row">
                <div>
                  Tema
                  <small>
                    Claro u oscuro
                  </small>
                </div>

                <ui-segmented
                  value={
                    document.documentElement.dataset
                      .theme || 'light'
                  }
                  label="Tema"
                  onchange={handleThemeChange}
                >
                  <option value="light">
                    Claro
                  </option>

                  <option value="dark">
                    Oscuro
                  </option>
                </ui-segmented>
              </div>

              <ui-stack gap="sm">
                <strong>
                  Color de acento
                </strong>

                <ui-radio-group
                  value="indigo"
                  orientation="horizontal"
                  label="Acento"
                  onchange={handleAccentChange}
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
                <ui-button
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
      </ui-stack>
    </div>
  );
}
