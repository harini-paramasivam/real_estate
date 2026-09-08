import { RouterProvider } from "react-router-dom";
import { router } from "./app/router/router";
import { AuthProvider } from "./app/providers/AuthProvider";
import { QueryProvider } from "./app/providers/QueryProvider";
import { PageTitleProvider } from "./app/providers/PageTitleProvider";
import { ToastProvider } from "./components/feedback/ToastProvider";

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <PageTitleProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </PageTitleProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
