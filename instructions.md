
### **Project Build Plan: LLD-PracticePad using Gemini CLI & Supabase**

**Objective:** Generate all the necessary code for a web application where users can solve Low-Level Design problems using a diagram editor, with an AI judge providing a score.

**Guiding Principle:** You will feed one prompt to the Gemini CLI at a time, review the generated code, save it to the specified file, and then move to the next prompt. You are the builder; Gemini is your tool.

---

### **Phase 0: Manual Setup

Before you start generating code, you must set up your environment.

1.  **Create a Supabase Project:**
    *   Go to [supabase.com](https://supabase.com), create a new project.
    *   Navigate to the **Table Editor**.
    *   Create the following tables:
        *   `profiles`:
            *   `id` (PK, `uuid`, links to `auth.users.id`)
            *   `username` (`text`)
            *   `points` (`int8`, default 0)
        *   `problems`:
            *   `id` (PK, `uuid`, default `uuid_generate_v4()`)
            *   `title` (`text`)
            *   `description` (`text`)
            *   `difficulty` (`text`, e.g., 'Easy', 'Medium', 'Hard')
        *   `problem_levels`:
            *   `id` (PK, `uuid`, default `uuid_generate_v4()`)
            *   `problem_id` (FK to `problems.id`)
            *   `level_number` (`int8`)
            *   `level_description` (`text`)
            *   `evaluation_criteria` (`jsonb` - this is crucial for the judge)
        *   `submissions`:
            *   `id` (PK, `uuid`, default `uuid_generate_v4()`)
            *   `user_id` (FK to `auth.users.id`)
            *   `level_id` (FK to `problem_levels.id`)
            *   `diagram_json` (`jsonb`)
            *   `score` (`int8`)
            *   `feedback` (`jsonb`)
            *   `created_at` (`timestamptz`, default `now()`)
    *   Go to **Project Settings -> API** and copy your **Project URL** and **`anon` public key**.

2.  **Set Up Local Frontend Project:**
    *   Open your terminal and create a new React + TypeScript project.
    *   ```bash
        npm create vite@latest lld-practice-pad -- --template react-ts
        cd lld-practice-pad
        ```
    *   Install all necessary dependencies:
    *   ```bash
        npm install @supabase/supabase-js react-router-dom @excalidraw/excalidraw tailwindcss postcss autoprefixer
        npm install -D @types/react-router-dom
        ```
    *   Initialize Tailwind CSS:
    *   ```bash
        npx tailwindcss init -p
        ```
    *   Configure `tailwind.config.js` and `index.css` as per the Tailwind CSS documentation.

---

### **Phase 1: Prompts for Gemini CLI**

Now, start generating the application code.

**Prompt 1: Supabase Client**
"Generate the code for a TypeScript file that initializes the Supabase client. It should import `createClient` from `@supabase/supabase-js`. It should read the Supabase URL and anon key from environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). Export the client instance as a default export. Save this as `src/lib/supabaseClient.ts`."

**Prompt 2: App Routing**
"Generate the code for the main App component in a React + TypeScript project. Use `react-router-dom` to set up the following routes:
*   `/`: Should render a `HomePage` component.
*   `/login`: Should render a `LoginPage` component.
*   `/signup`: Should render a `SignupPage` component.
*   `/problems`: Should render a `ProblemListPage` component.
*   `/problem/:id`: Should render a `ProblemSolvingPage` component.
*   `/profile`: Should render a `ProfilePage` component.
Save this as `src/App.tsx`."

**Prompt 3: Authentication Context**
"Generate a React context provider for handling Supabase authentication. It should be written in TypeScript. The provider should:
1.  Expose the current user session and profile data.
2.  Use the Supabase `onAuthStateChange` listener to automatically update the session.
3.  When a user logs in, fetch their corresponding data from the `profiles` table.
4.  Provide a `logout` function.
Save this as `src/contexts/AuthContext.tsx`."

**Prompt 4: Signup Page**
"Generate the code for a React `SignupPage` component using TypeScript and Tailwind CSS. The form should have fields for email, password, and username. On submission, it should:
1.  Call the Supabase `signUp` function with the email and password.
2.  If signup is successful, insert a new record into the `profiles` table with the user's ID and username.
3.  Handle and display any potential errors."

**Prompt 5: Login Page**
"Generate the code for a React `LoginPage` component using TypeScript and Tailwind CSS. The form should have fields for email and password. On submission, it should call the Supabase `signInWithPassword` function. It should handle loading and error states and redirect to the `/problems` page on success."

**Prompt 6: Problem List Page**
"Generate the code for a `ProblemListPage` component. Using the Supabase client, it should fetch all records from the `problems` table in `useEffect`. It should display the problems in a list or table, showing the `title` and `difficulty`. Each problem title should be a link that navigates to `/problem/[id]` using `react-router-dom`'s `Link` component."

**Prompt 7: The Diagram Editor Component**
"Generate a React component named `DiagramEditor`. It should:
1.  Use the `@excalidraw/excalidraw` library to render the Excalidraw editor.
2.  Provide a prop `onSubmit` which is a function that takes the diagram's scene elements as an argument.
3.  Include a 'Submit Design' button styled with Tailwind CSS. When clicked, this button should get the current scene elements from the Excalidraw API and call the `onSubmit` prop with that data."

**Prompt 8: The Problem Solving Page**
"Generate the `ProblemSolvingPage` component. It should:
1.  Get the problem `id` from the URL using `useParams` from `react-router-dom`.
2.  Fetch the details for that specific problem and all its associated `problem_levels` from Supabase.
3.  Display the problem title and the description for the current level (start with level 1).
4.  Render the `DiagramEditor` component created in the previous step.
5.  Define the `handleSubmit` logic that will be passed to the editor's `onSubmit` prop. This logic will trigger the AI Judge."

**Prompt 9: The AI Judge (Supabase Edge Function)**
"Generate a Python Supabase Edge Function using FastAPI. The function should be named `judge-design`. It must:
1.  Accept a POST request with a JSON body containing `evaluation_criteria` and `user_diagram_json`.
2.  Create a detailed prompt for the Gemini LLM. The prompt template should be: 'You are an expert software architect. A user has submitted a diagram for a problem with the following requirements: [insert evaluation_criteria]. Their diagram is represented by this JSON: [insert user_diagram_json]. Please evaluate the design's adherence to the requirements, SOLID principles, and appropriate use of design patterns. Return a JSON object with two keys: "score" (an integer from 0 to 100) and "feedback" (a string explaining your reasoning).'
3.  Make an API call to the Gemini API with this prompt. (You will need to add your Gemini API key as an environment variable in Supabase).
4.  Parse the LLM's response and return it as the function's response."

*   **Your Action:** You will need to create this Edge Function in your Supabase project dashboard or via the Supabase CLI and deploy it.

**Prompt 10: Final Submission Logic (Updating the Problem Solving Page)**
"Update the `handleSubmit` function within the `ProblemSolvingPage` component. This function should:
1.  Take the `diagram_json` from the `DiagramEditor`.
2.  Get the `evaluation_criteria` for the current problem level.
3.  Invoke the `judge-design` Supabase Edge Function, passing it the `evaluation_criteria` and `diagram_json`.
4.  Once it receives the `score` and `feedback` from the function, it should save a new record to the `submissions` table in Supabase, including the `user_id`, `level_id`, `diagram_json`, `score`, and `feedback`.
5.  Display the score and feedback to the user."

---

### **How to Use These Instructions**

1.  **Be Patient and Iterative:** Do not try to do everything at once. Run one prompt, get the code, and integrate it into your project. Test that small piece to see if it works before moving on.
2.  **Review and Refine:** Gemini will generate excellent code, but you are the final authority. You may need to make small adjustments to variable names, types, or logic to fit your exact structure.
3.  **Handle Environment Variables:** Remember to create a `.env` file in your React project root for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

By following this detailed plan, you will systematically build your entire application, leveraging the Gemini CLI for code generation and Supabase for a powerful, scalable, and free backend.