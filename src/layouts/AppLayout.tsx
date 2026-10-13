import {
  useEffect,
  useRef,
} from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { toast } from '@abelfuentes/ui-controls/toast';
import { useAuth } from '../auth/AuthContext';
import { usePreferences } from '../preferences/PreferencesContext';
import './app-layout.css';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, signOut } = useAuth();
  const { preferences, avatarSrc } = usePreferences();

  const dropdownRef = useRef<HTMLElement>(null);

  const firstName =
    preferences?.first_name?.trim() || '';

  const lastName =
    preferences?.last_name?.trim() || '';

  const fullName =
    `${firstName} ${lastName}`.trim();

  const displayName =
    fullName ||
    user?.email ||
    'Usuario';

  useEffect(() => {
    const dropdown = dropdownRef.current;

    if (!dropdown) {
      return;
    }

    const handleMenuSelect = async (event: Event) => {
      const customEvent =
        event as CustomEvent<{ value: string }>;

      const value =
        customEvent.detail?.value;

      if (value === 'logout') {
        try {
          await signOut();
        } catch {
          toast.danger(
            'No se pudo cerrar la sesión',
            {
              title: 'Error',
            },
          );
        }

        return;
      }

      if (value === 'profile') {
        navigate('/settings');
      }
    };

    dropdown.addEventListener(
      'select',
      handleMenuSelect,
    );

    return () => {
      dropdown.removeEventListener(
        'select',
        handleMenuSelect,
      );
    };
  }, [navigate, signOut]);

  return (
    <ui-app-shell>
      <strong
        slot="header"
        className="app-layout-brand"
      >
        Fiscoo
      </strong>

      <ui-input
        slot="header"
        size="sm"
        type="search"
        placeholder="Buscar..."
        className="app-layout-search"
      />

      <span
        slot="header"
        className="app-layout-header-spacer"
      />

      <ui-theme-switch
        slot="header"
        size="sm"
      />

      <ui-dropdown
        ref={dropdownRef as any}
        slot="header"
        placement="bottom-end"
      >
        <ui-avatar
          slot="trigger"
          name={displayName}
          src={avatarSrc}
          size="sm"
          status="online"
        />

        <option value="profile">
          Mi perfil
        </option>

        <option data-separator />

        <option
          value="logout"
          data-danger
        >
          Cerrar sesión
        </option>
      </ui-dropdown>

      <ui-stack
        slot="sidebar"
        className="app-layout-sidebar"
      >
        <ui-button
          variant={
            location.pathname === '/dashboard'
              ? 'soft'
              : 'ghost'
          }
          block
          onClick={() =>
            navigate('/dashboard')
          }
        >
          Resumen
        </ui-button>

        <ui-button
          variant={
            location.pathname.startsWith('/clients')
              ? 'soft'
              : 'ghost'
          }
          block
          onClick={() =>
            navigate('/clients')
          }
        >
          Clientes
        </ui-button>

        <ui-button
          variant={
            location.pathname.startsWith('/invoices')
              ? 'soft'
              : 'ghost'
          }
          block
          onClick={() =>
            navigate('/invoices')
          }
        >
          Facturas
        </ui-button>

        <ui-button
          variant={
            location.pathname.startsWith('/expenses')
              ? 'soft'
              : 'ghost'
          }
          block
          onClick={() =>
            navigate('/expenses')
          }
        >
          Gastos
        </ui-button>

        <ui-button
          variant={
            location.pathname.startsWith('/income')
              ? 'soft'
              : 'ghost'
          }
          block
          onClick={() =>
            navigate('/income')
          }
        >
          Ingresos
        </ui-button>

        <ui-button
          variant="ghost"
          block
          disabled
        >
          Reportes
        </ui-button>
      </ui-stack>

      <Outlet />

      <span
        slot="footer"
        className="app-layout-footer"
      >
        © Fiscoo
      </span>
    </ui-app-shell>
  );
}
