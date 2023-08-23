import { createContext, useContext } from "react";

type User = {
  name: string;
};

type AuthContextType = {
  user: User;
};

const AuthContext = createContext({} as AuthContextType);
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Provider
      value={{
        user: {
          name: "test",
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
