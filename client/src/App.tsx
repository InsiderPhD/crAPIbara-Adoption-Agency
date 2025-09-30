import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Pets as PetsIcon,
  Favorite as FavoriteIcon,
  AccessTime as AccessTimeIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useRecentPets, useLongStayPets } from './hooks/usePets';
import BrowsePets from './pages/BrowsePets';
import PetDetails from './pages/PetDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';
import ViewApplications from './pages/ViewApplications';
import MyApplications from './pages/MyApplications';
import TestImages from './pages/TestImages';
import AllApplications from './pages/AllApplications';
import AdoptionForm from './pages/AdoptionForm';
import UpdateProfile from './pages/UpdateProfile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RescueRequestForm from './pages/RescueRequestForm';
import Transactions from './pages/Transactions';
import AdminTransactions from './pages/AdminTransactions';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminLogs from './pages/AdminLogs';
import AdminRescueManagement from './pages/AdminRescueManagement';
import AdminCouponManagement from './pages/AdminCouponManagement';
import ManageRescue from './pages/ManageRescue';
import PetRecommendation from './pages/PetRecommendation';
import PromotionBanner from './components/PromotionBanner';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      '@media (min-width:600px)': {
        fontSize: '3.5rem',
      },
      '@media (min-width:960px)': {
        fontSize: '4rem',
      },
    },
    h2: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:960px)': {
        fontSize: '3rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2.5rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      '@media (min-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    body1: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.1rem',
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

function HomePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const { data: recentPetsData, isLoading: isLoadingRecent } = useRecentPets();
  const { data: longStayPetsData, isLoading: isLoadingLongStay } = useLongStayPets();

  const formatSpecies = (species: string) => {
    const speciesMap: { [key: string]: string } = {
      'capybara': 'Capybara',
      'guinea_pig': 'Guinea Pig',
      'rock_cavy': 'Rock Cavy',
      'chinchilla': 'Chinchilla'
    };
    return speciesMap[species] || species.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatSize = (size: string) => {
    return size.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          px: { xs: 2, md: 4 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            Find Your Perfect Exotic Pet
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
            Adopt a loving companion from our network of trusted rescues
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large" 
            component={Link}
            to="/browse"
            sx={{ fontSize: { xs: '1rem', md: '1.2rem' } }}
          >
            Browse Available Pets
          </Button>
        </Container>
      </Box>

      {/* Recent Pets Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          Recently Listed
        </Typography>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {isLoadingRecent ? (
            <Typography>Loading recent pets...</Typography>
          ) : (
            recentPetsData?.data.map((pet) => (
              <Card 
                key={pet.id} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  bgcolor: pet.isPromoted ? '#ffebee' : 'background.paper', // Red background for promoted pets
                  border: pet.isPromoted ? '2px solid #f44336' : 'none', // Red border for promoted pets
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.2s ease-in-out',
                  }
                }}
                component={Link}
                to={`/pets/${pet.id}`}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={pet.imageUrl}
                  alt={pet.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3">
                    {pet.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {formatSpecies(pet.species)} • {pet.age} years old • {formatSize(pet.size)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pet.description}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'grey.100', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            Why Adopt?
          </Typography>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)'
            },
            gap: 3
          }}>
            {[
              {
                title: 'Save a Life',
                description: 'Give a loving home to an animal in need and make a difference in their life.',
              },
              {
                title: 'Support Rescues',
                description: 'Help our network of trusted rescue organizations continue their important work.',
              },
              {
                title: 'Find Your Match',
                description: 'Connect with the perfect companion that matches your lifestyle and preferences.',
              },
            ].map((benefit, index) => (
              <Card key={index} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Long-stay Pets Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          Long-term Residents
        </Typography>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {isLoadingLongStay ? (
            <Typography>Loading long-stay pets...</Typography>
          ) : (
            longStayPetsData?.data.map((pet) => (
              <Card 
                key={pet.id} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  bgcolor: pet.isPromoted ? '#ffebee' : 'background.paper', // Red background for promoted pets
                  border: pet.isPromoted ? '2px solid #f44336' : 'none', // Red border for promoted pets
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.2s ease-in-out',
                  }
                }}
                component={Link}
                to={`/pets/${pet.id}`}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={pet.imageUrl}
                  alt={pet.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3">
                    {pet.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {formatSpecies(pet.species)} • {pet.age} years old • {formatSize(pet.size)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pet.description}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Container>

      {/* Footer Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 4, mt: 4 }}>
        <Container maxWidth="lg">
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Running a rescue, even if it's a small one?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              You can list your water-loving rodents here, request a rescue account!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/request-rescue"
              size="large"
            >
              Request Rescue Account
            </Button>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Debug: Log auth state
  console.log('Navbar - User:', user);
  console.log('Navbar - Is authenticated:', isAuthenticated);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        height: { xs: 56, sm: 64 },
        px: { xs: 2, sm: 3, md: 4 },
        maxWidth: '1200px',
        mx: 'auto',
        width: '100%'
      }}>
        <Box
          component="img"
          src="http://localhost:4000/images/logo.png"
          alt="Gentle Giants Logo"
          sx={{ 
            height: { xs: 32, sm: 40 },
            width: 'auto',
            mr: 1
          }}
        />
        <Typography 
          variant="h6" 
          component={Link}
          to="/"
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            color: 'white',
            textDecoration: 'none',
            flexGrow: 1,
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none'
            }
          }}
        >
          Gentle Giants
        </Typography>
        <Button 
          color="inherit" 
          component={Link}
          to="/browse"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          Browse Pets
        </Button>

        {user?.role === 'user' && (
          <>
        <Button 
          color="inherit" 
          component={Link}
          to="/pet-recommendation"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          Find My Pet
        </Button>
        </>
      )}
        {user?.role === 'rescue' && (
          <>
            <Button
              color="inherit"
              component={Link}
              to="/add-pet"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              Add Pet
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/applications"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              All Applications
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/manage-rescue"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              Manage Rescue
            </Button>
          </>
        )}
        {user?.role === 'admin' && (
          <>
          <Button
            color="inherit"
            component={Link}
            to="/applications"
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }
            }}
          >
            All Applications
          </Button>
            <Button
              color="inherit"
              component={Link}
              to="/transactions"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              Transactions
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/admin/users"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              User Management
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/admin/rescues"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              Rescue Management
            </Button>

            <Button
              color="inherit"
              component={Link}
              to="/admin/coupons"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              Coupon Codes
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/admin/logs"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              Audit Logs
            </Button>
          </>
        )}
        {user?.role === 'user' && (
          <Button
            color="inherit"
            component={Link}
            to="/my-applications"
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }
            }}
          >
            My Applications
          </Button>
        )}
        {user ? (
          <>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>{user.username}</MenuItem>
              <MenuItem 
                component={Link} 
                to="/update-profile"
                onClick={handleClose}
              >
                Update Profile
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/transactions"
                onClick={handleClose}
              >
                Transactions
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button 
              color="inherit" 
              component={Link}
              to="/login"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              Login
            </Button>
            <Button 
              color="inherit" 
              component={Link}
              to="/register"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              Register
            </Button>
          </>
        )}
      </Box>
    </AppBar>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Box sx={{ width: '100vw', overflowX: 'hidden' }}>
              <Navbar />
              <PromotionBanner />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/browse" element={<BrowsePets />} />
                <Route path="/pets/:id" element={<PetDetails />} />
                <Route path="/pets/:id/edit" element={<EditPet />} />
                <Route path="/pets/:id/applications" element={<ViewApplications />} />
                <Route path="/pets/:id/apply" element={<AdoptionForm />} />
                <Route path="/my-applications" element={<MyApplications />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/add-pet" element={<AddPet />} />
                <Route path="/test-images" element={<TestImages />} />
                <Route path="/applications" element={<AllApplications />} />
                <Route path="/update-profile" element={<UpdateProfile />} />
                <Route path="/request-rescue" element={<RescueRequestForm />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/admin/transactions" element={<AdminTransactions />} />
                <Route path="/admin/users" element={<AdminUserManagement />} />
                <Route path="/admin/rescues" element={<AdminRescueManagement />} />
                <Route path="/admin/coupons" element={<AdminCouponManagement />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="/manage-rescue" element={<ManageRescue />} />
                <Route path="/pet-recommendation" element={<PetRecommendation />} />
                <Route path="*" element={<Navigate to="/browse" replace />} />
              </Routes>
            </Box>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
