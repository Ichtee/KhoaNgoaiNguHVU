import { createContext, useContext } from 'react';

// The admin's session, provided by Layout: true only inside /quan-tri once the server has confirmed it.
export const AdminContext = createContext({ admin: false, signOut() {}, refresh() {} });
export const useAdmin = () => useContext(AdminContext);
