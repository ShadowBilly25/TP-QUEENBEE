
export function createAuthController({ authService }) {
  return {
    // Créer un compte utilisateur
    async register(req, res) {
      const { email, password, role, site_id } = req.validated.body;

      const user = await authService.register({
        email,
        password,
        role,
        site_id,
      });

      res.status(201).json(user);
    },

    // Authentifier un utilisateur
    async login(req, res) {
      const { email, password } = req.validated.body;

      const result = await authService.login(email, password);

      res.json(result);
    },

    // Renouveler les tokens
    async refresh(req, res) {
      const { refresh_token } = req.validated.body;

      const result = await authService.refresh(refresh_token);

      res.json(result);
    },
  };
}
