# Contributing to SkillShift

Thank you for considering contributing to SkillShift! We welcome bug reports, feature suggestions, and code contributions to help grow and improve this project.

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Getting Started

### Prerequisites

Before running the project locally, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Git](https://git-scm.com/)

### Local Development Setup

1. **Fork the Repository**  
   Click the **Fork** button at the top right of this repository to create your own copy.

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/adityasah15/skillshift.git
   cd skillshift
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Environment Configuration**  
   Copy the example environment file and set your local credentials:
   ```bash
   cp .env.example .env
   ```

5. **Run the Application**
   ```bash
   # Development mode
   npm run start:dev
   ```

---

## How to Contribute

### 1. Reporting Bugs

If you encounter a bug or unexpected behavior:

1. Check existing [Issues](https://github.com/adityasah15/skillshift/issues) to ensure it hasn't already been reported.
2. Open a new issue with a clear title and detailed description, including:
   - Steps to reproduce the issue
   - Expected vs. actual behavior
   - Node/npm versions and OS environment details

### 2. Suggesting Enhancements

Feature requests are always welcome! When creating a feature request issue, please include:

- The problem or use case you are trying to solve
- Your proposed solution or desired behavior

### 3. Submitting Pull Requests (PRs)

1. **Create a Branch**  
   Create a dedicated branch for your work off the `main` branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes:
   git checkout -b fix/your-bug-fix
   ```

2. **Make Changes & Test**  
   Write clean, readable code and verify that local build and lint steps pass:
   ```bash
   # Run linter
   npm run lint

   # Run tests
   npm run test
   ```

3. **Commit Changes**  
   Write clear, descriptive commit messages following conventional commit style:
   ```bash
   git commit -m "feat: add user skill verification endpoint"
   ```

4. **Push & Open PR**  
   Push your branch to GitHub and create a Pull Request targeting `main`:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Fill in the PR description template with relevant details and reference any related issue numbers (e.g., `Closes #12`).

---

## Coding Standards

- **TypeScript**: Follow strict typing standards and avoid using `any` where explicit types or interfaces can be defined.
- **Code Style**: Ensure code conforms to the project's ESLint and Prettier rules.
- **Commits**: Follow clean, conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, etc.).

---

## License

By contributing to SkillShift, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
