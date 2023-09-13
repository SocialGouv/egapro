/**
 * Hook to get the user data, to login with a token in an URL and to redirect to a page if no token is found.
 *
 * @example
 * ```ts
 * useUser({ redirectTo: "/authPage" }); => redirects to /authPage if no token are found in local storage
 * ```
 *
 * @example
 * ```ts
 * const {
 *  user,            // user data
 *  error,           // potential useSWR error in fetching user data
 *  logout,          // function to logout
 *  isAuthenticated, // helper to know if the user is authenticated
 *  loading,         // boolean set as true if the asynchron fetch to get user information is in progress
 * } = useUser();
 * ```
 */
export const useUserMocked = ({ redirectTo: _ }: { redirectTo?: string } = {}) => {
  return {
    user: { email: "john.maclane@gmail.com" },
    error: "",
    logout: () => {},
    isAuthenticated: true,
    loading: false,
  };
};
