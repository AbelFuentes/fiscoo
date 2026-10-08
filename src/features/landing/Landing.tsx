import { useNavigate } from 'react-router-dom';
import {
  LANDING_AVATARS,
  LANDING_TESTIMONIALS,
} from './landing.constants';
import './landing.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="container landing-nav-inner">
          <span className="landing-logo">Fiscoo</span>

          <div className="landing-nav-actions">
            <ui-button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Iniciar sesión
            </ui-button>

            <ui-button
              size="sm"
              onClick={() => navigate('/login')}
            >
              Comenzar
            </ui-button>
          </div>
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <div className="container">
            <div className="landing-hero-content">
              <ui-badge tone="accent">
                Finanzas simples para tu negocio
              </ui-badge>

              <h1>
                Todo lo que necesitas para llevar tus finanzas{' '}
                <em>en orden.</em>
              </h1>

              <p className="landing-hero-lead">
                Fiscoo reúne facturación, clientes, gastos y
                reportes en un solo lugar para que puedas
                concentrarte en hacer crecer tu negocio.
              </p>

              <div className="landing-hero-actions">
                <ui-button
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  Empieza gratis
                </ui-button>

                <ui-button
                  variant="soft"
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  Ver cómo funciona
                </ui-button>
              </div>

              <div className="landing-trust">
                <div className="landing-avatar-stack">
                  {LANDING_AVATARS.map((avatar) => (
                    <ui-avatar
                      key={avatar}
                      name={avatar}
                      size="sm"
                    />
                  ))}
                </div>

                <span>
                  Hecho para negocios que quieren trabajar mejor.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="container">
            <div className="landing-section-heading center">
              <h2>Hecho para simplificar.</h2>

              <p>
                Sin configuraciones interminables. Sin
                herramientas innecesarias.
              </p>
            </div>

            <ui-grid min="18rem">
              {LANDING_TESTIMONIALS.map((testimonial) => (
                <ui-card
                  key={testimonial.name}
                  padding="lg"
                  variant="outlined"
                  class="landing-testimonial"
                >
                  <p className="landing-testimonial-quote">
                    “{testimonial.quote}”
                  </p>

                  <div className="landing-testimonial-author">
                    <ui-avatar
                      name={testimonial.avatar}
                      size="sm"
                    />

                    <div>
                      <div className="landing-testimonial-name">
                        {testimonial.name}
                      </div>

                      <div className="landing-testimonial-role">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </ui-card>
              ))}
            </ui-grid>
          </div>
        </section>

        <section className="landing-section landing-cta">
          <div className="container">
            <ui-card
              padding="lg"
              variant="outlined"
              class="landing-cta-card"
            >
              <div className="landing-cta-content">
                <h2>
                  Tus finanzas,
                  <br />
                  <em>mucho más simples.</em>
                </h2>

                <p>
                  Empieza a organizar tu negocio hoy mismo.
                </p>

                <ui-button
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  Crear mi cuenta
                </ui-button>
              </div>
            </ui-card>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <span className="landing-footer-brand">
            Fiscoo
          </span>

          <span className="landing-footer-copy">
            Finanzas simples para tu negocio.
          </span>

          <span className="landing-footer-copy">
            © {new Date().getFullYear()} Fiscoo
          </span>
        </div>
      </footer>
    </div>
  );
}
