import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../../auth/AuthContext';
import ClientForm from './ClientForm';
import {
  createClient,
  getClients,
  type Client,
  type ClientInput,
} from './userClients';
import './clients.css';

export default function Clients() {
  const { user } = useAuth();

  const drawerRef =
    useRef<HTMLElement>(null);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState('');

  useEffect(() => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadClients = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const data =
          await getClients(user.id);

        if (!mounted) return;

        setClients(data);
      } catch (error) {
        console.error(
          'Error loading clients:',
          error,
        );

        if (!mounted) return;

        setLoadError(
          'No se pudieron cargar tus clientes.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadClients();

    return () => {
      mounted = false;
    };
  }, [user]);

  const filteredClients =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return clients;
      }

      return clients.filter(
        (client) =>
          client.legal_name
            .toLowerCase()
            .includes(value) ||
          client.rfc
            .toLowerCase()
            .includes(value),
      );
    }, [clients, search]);

  const openCreateDrawer = () => {
    setSaveError(null);

    const drawer =
      drawerRef.current as any;

    drawer?.show();
  };

  const closeCreateDrawer = () => {
    if (saving) {
      return;
    }

    const drawer =
      drawerRef.current as any;

    drawer?.close();
  };

  const handleCreate = async (
    input: ClientInput,
  ) => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const client =
        await createClient(
          user.id,
          input,
        );

      setClients((current) =>
        [...current, client].sort(
          (a, b) =>
            a.legal_name.localeCompare(
              b.legal_name,
            ),
        ),
      );

      const drawer =
        drawerRef.current as any;

      drawer?.close();
    } catch (error) {
      console.error(
        'Error creating client:',
        error,
      );

      setSaveError(
        'No se pudo crear el cliente.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ui-stack gap="lg">
        <div className="clients-header">
          <div>
            <h1 className="clients-title">
              Clientes
            </h1>

            <p className="clients-subtitle">
              Administra la información fiscal de tus clientes.
            </p>
          </div>

          <ui-button
            onClick={openCreateDrawer}
          >
            <svg
              slot="start"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>

            Nuevo cliente
          </ui-button>
        </div>

        {loadError && (
          <ui-alert tone="danger">
            <span slot="title">
              Ocurrió un problema
            </span>

            {loadError}
          </ui-alert>
        )}

        {!loadError && (
          <>
            <ui-input
              type="search"
              placeholder="Buscar por nombre o RFC..."
              value={search}
              onInput={(event) => {
                const target =
                  event.currentTarget as HTMLElement & {
                    value?: string;
                  };

                setSearch(
                  target.value || '',
                );
              }}
            />

            {loading ? (
              <div className="clients-loading">
                <ui-stack gap="sm">
                  <ui-skeleton height="3rem" />
                  <ui-skeleton height="3rem" />
                  <ui-skeleton height="3rem" />
                </ui-stack>
              </div>
            ) : clients.length === 0 ? (
              <div className="clients-empty">
                <ui-stack
                  gap="sm"
                  align="center"
                >
                  <h2>
                    Aún no tienes clientes
                  </h2>

                  <p>
                    Agrega tu primer cliente
                    para comenzar a emitir
                    facturas.
                  </p>

                  <ui-button
                    onClick={
                      openCreateDrawer
                    }
                  >
                    Crear primer cliente
                  </ui-button>
                </ui-stack>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="clients-empty">
                <ui-stack
                  gap="sm"
                  align="center"
                >
                  <h2>
                    No encontramos clientes
                  </h2>

                  <p>
                    Prueba con otro nombre
                    o RFC.
                  </p>
                </ui-stack>
              </div>
            ) : (
              <ui-table
                columns={[
                  {
                    key: 'legal_name',
                    label: 'Cliente',
                    sortable: true,
                  },
                  {
                    key: 'rfc',
                    label: 'RFC',
                    sortable: true,
                  },
                  {
                    key: 'tax_regime',
                    label: 'Régimen fiscal',
                  },
                  {
                    key: 'tax_zip_code',
                    label: 'C.P. fiscal',
                  },
                  {
                    key: 'cfdi_use',
                    label: 'Uso CFDI',
                  },
                ]}
                rows={filteredClients}
              />
            )}
          </>
        )}
      </ui-stack>

      <ui-drawer
        ref={
          drawerRef as any
        }
        size="lg"
      >
        {saveError && (
          <ui-alert
            tone="danger"
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              right: '1rem',
              zIndex: 10,
            }}
          >
            <span slot="title">
              No se pudo guardar
            </span>

            {saveError}
          </ui-alert>
        )}

        <ClientForm
          saving={saving}
          onSubmit={handleCreate}
          onCancel={
            closeCreateDrawer
          }
        />
      </ui-drawer>
    </>
  );
}
