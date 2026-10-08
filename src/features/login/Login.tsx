import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@abelfuentes/ui-controls/toast';
import { useAuth } from '../../auth/AuthContext';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const formRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

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

    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    setShowError(false);
    setLoading(true);

    try {
      await signIn(email, password);

      toast.success(`Hola, ${email}`, {
        title: 'Sesión iniciada',
      });

      navigate('/dashboard', { replace: true });
    } catch {
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg">
      <ui-theme-switch
        className="corner"
        size="sm"
      />

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

              <h1>Bienvenido de vuelta</h1>

              <p>
                Ingresa a tu cuenta para continuar
              </p>
            </ui-stack>

            <ui-alert
              tone="danger"
              hidden={!showError}
              dismissible
            >
              Correo o contraseña incorrectos.
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
              required
              minlength={4}
            />

            <div className="row">
              <ui-checkbox
                name="remember"
                checked
              >
                Recuérdame
              </ui-checkbox>

              <a href="#olvide">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <ui-button
              type="submit"
              block
              size="lg"
              loading={loading}
            >
              Iniciar sesión
            </ui-button>

            <div className="or">
              o continúa con
            </div>

            <ui-stack
              direction="row"
              gap="sm"
            >
              <ui-button
                variant="outline"
                block
                style={{ flex: 1 }}
              >
                Google
              </ui-button>

              <ui-button
                variant="outline"
                block
                style={{ flex: 1 }}
              >
                GitHub
              </ui-button>
            </ui-stack>

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
