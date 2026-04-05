import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth'
import Breadcrumbs from '../ui/Breadcrumbs';

const Dashboard = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  let navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authtoken")) {
      navigate("/login")
    }
  }, [navigate]);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  //getting user role
  const { user, loading } = useAuth();
  console.log(user)
  const userRole = user?.data?.roles?.[0];
  //userRole fetched

  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        userRole={userRole} 
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        isMobile={isMobile}
      />
      
             {/* Main Content Area */}
       <div 
         className={`
           flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
           ${!isMobile && isSidebarExpanded ? 'ml-56' : !isMobile ? 'ml-16' : 'ml-0'}
         `}
       >
        <Header />
        <Breadcrumbs />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-3">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;