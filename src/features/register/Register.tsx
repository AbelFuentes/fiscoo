import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@abelfuentes/ui-controls/toast';
import { supabase } from '../../lib/supabase';
import '../login/login.css';

const MIN_PASSWORD_LENGTH = 8;

const errorMessage = (error: unknown) => {
  const code = (error as { code?: string })?.code;

  if (code === 'weak_password') {
    return 'La contraseña es muy débil. Usa más caracteres y mezcla letras y números.';
  }

  if (code === 'over_email_send_rate_limit') {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  }

  return 'No se pudo crear la cuenta. Si ya tienes una, inicia sesión.';
};

export default function Register() {
  const navigate = useNavigate();

  const formRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const form = formRef.current;

    if (!form) return;

    const inputs = Array.from(
      form.querySelectorAll('ui-input'),
    ) as HTMLElement[];

    const invalid = inputs.find(
      (input) =>
        typeof (input as any).checkValidity === 'function' &&
        !(input as any).checkValidity(),
    );

    if (invalid) {
      (invalid as any).reportValidity();
      return;
    }

    const formData = new FormData(form);

    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const confirm = String(formData.get('confirm') ?? '');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        toast.success('Tu cuenta está lista', {
          title: 'Bienvenido a Fiscoo',
        });

        navigate('/dashboard', { replace: true });

        return;
      }

      setSentTo(email);
    } catch (signUpError) {
      console.error('Error creating account:', signUpError);

      setError(errorMessage(signUpError));
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <div className="lg">
        <ui-card
          style={{ width: 'min(26rem,100%)' }}
          padding="lg"
        >
          <ui-stack
            gap="lg"
            align="center"
            style={{ textAlign: 'center' }}
          >
            <div className="logo">F</div>

            <h1>Revisa tu correo</h1>

            <p>
              Si <strong>{sentTo}</strong> es un correo nuevo, te
              enviamos un enlace para confirmar tu cuenta. Después
              podrás iniciar sesión.
            </p>

            <ui-button block onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </ui-button>
          </ui-stack>
        </ui-card>
      </div>
    );
  }

  return (
    <div className="lg">
      <ui-card
        style={{ width: 'min(26rem,100%)' }}
        padding="lg"
      >
        <form
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
        >
          <ui-stack gap="lg">
            <ui-stack
              gap="sm"
              align="center"
              style={{ textAlign: 'center' }}
            >
              <div className="logo">F</div>

              <h1>Crea tu cuenta</h1>

              <p>Tus finanzas, sin complicarte.</p>
            </ui-stack>

            <ui-alert
              tone="danger"
              hidden={!error}
              dismissible
            >
              {error}
            </ui-alert>

            <ui-input
              name="email"
              type="email"
              label="Correo"
              required
            />

            <ui-input
              name="password"
              type="password"
              label="Contraseña"
              hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              required
              minlength={MIN_PASSWORD_LENGTH}
            />

            <ui-input
              name="confirm"
              type="password"
              label="Confirmar contraseña"
              required
              minlength={MIN_PASSWORD_LENGTH}
            />

            <ui-button
              type="submit"
              block
              size="lg"
              loading={loading}
            >
              Crear cuenta
            </ui-button>

            <p style={{ textAlign: 'center', margin: 0 }}>
              ¿Ya tienes cuenta?{' '}
              <a
                href="/login"
                onClick={(event) => {
                  event.preventDefault();
                  navigate('/login');
                }}
              >
                Inicia sesión
              </a>
            </p>

            <ui-button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              ← Inicio
            </ui-button>
          </ui-stack>
        </form>
      </ui-card>
    </div>
  );
}
