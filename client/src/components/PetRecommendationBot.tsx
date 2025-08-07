import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Send as SendIcon,
  Pets as PetsIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config/api';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface Question {
  id: string;
  text: string;
  options?: string[];
  type: 'text' | 'select' | 'number';
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age: number;
  size: string;
  description: string;
  imageUrl?: string;
  isAdopted: boolean;
  score?: number;
}

const PetRecommendationBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [recommendations, setRecommendations] = useState<Pet[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [availablePets, setAvailablePets] = useState<Pet[]>([]);

  const questions: Question[] = [
    {
      id: 'experience',
      text: "What's your experience level with small pets?",
      options: ['Beginner (first time with small pets)', 'Intermediate (had guinea pigs/rock cavies before)', 'Expert (experienced with various small animals)'],
      type: 'select'
    },
    {
      id: 'lifestyle',
      text: "How much time can you dedicate to your pet daily?",
      options: ['Very busy (1-2 hours max)', 'Moderate (2-4 hours)', 'Flexible (4+ hours)', 'Lots of time (work from home/student)'],
      type: 'select'
    },
    {
      id: 'space',
      text: "What's your living space like?",
      options: ['Small apartment (limited space)', 'Medium apartment/house', 'Large house with yard', 'Rural property with outdoor space'],
      type: 'select'
    },
    {
      id: 'preference',
      text: "Which type of small pet interests you most?",
      options: ['Capybaras (large, social, need outdoor space)', 'Guinea pigs (friendly, vocal, need companions)', 'Rock cavies (independent, active)', 'I\'m open to any small pet!'],
      type: 'select'
    }
  ];

  useEffect(() => {
    // Load available pets
    const loadPets = async () => {
      try {
        const response = await axios.get(`${API_URL}/pets?isAdopted=false&limit=50`);
        console.log('API response:', response.data);
        if (response.data.data) {
          setAvailablePets(response.data.data || []);
        }
      } catch (error) {
        console.error('Error loading pets:', error);
      }
    };
    loadPets();
  }, []);

  useEffect(() => {
    // Start conversation
    if (messages.length === 0) {
      addBotMessage("Hi! I'm your small pet adoption assistant. I'll help you find the perfect capybara, guinea pig, or rock cavy for your lifestyle. Let's get started!");
      setTimeout(() => {
        askQuestion(0);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    console.log('Recommendations state changed:', recommendations);
  }, [recommendations]);

  const addBotMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const askQuestion = (index: number) => {
    if (index < questions.length) {
      const question = questions[index];
      addBotMessage(question.text);
      setCurrentQuestionIndex(index);
    } else {
      // All questions answered, generate recommendations
      generateRecommendations();
    }
  };

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    addUserMessage(answer);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      askQuestion(currentQuestionIndex + 1);
    }, 1000);
  };

  const generateRecommendations = () => {
    setIsTyping(true);
    
    setTimeout(() => {
      addBotMessage("Based on your preferences and the pets' personalities, I've found some perfect small pets for you!");
      
      const filteredPets = filterPetsByPreferences();
      console.log('Filtered pets in generateRecommendations:', filteredPets);
      setRecommendations(filteredPets.slice(0, 3)); // Show top 3 recommendations
      console.log('Setting recommendations:', filteredPets.slice(0, 3));
      setShowRecommendations(true);
      setIsTyping(false);
    }, 2000);
  };

  const filterPetsByPreferences = (): Pet[] => {
    console.log('Available pets:', availablePets);
    console.log('User answers:', answers);
    
    let filtered = [...availablePets];

    // Filter by experience level
    if (answers.experience === 'Beginner (first time with small pets)') {
      filtered = filtered.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    } else if (answers.experience === 'Intermediate (had guinea pigs/rock cavies before)') {
      filtered = filtered.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    } else if (answers.experience === 'Expert (experienced with various small animals)') {
      // Experts can handle any small pet
      filtered = filtered.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    }

    console.log('After experience filter:', filtered);

    // Filter by lifestyle
    if (answers.lifestyle === 'Very busy (1-2 hours max)') {
      filtered = filtered.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    } else if (answers.lifestyle === 'Moderate (2-4 hours)' || 
               answers.lifestyle === 'Flexible (4+ hours)' ||
               answers.lifestyle === 'Lots of time (work from home/student)') {
      // More time available, can handle any small pet
      filtered = filtered.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    }

    console.log('After lifestyle filter:', filtered);

    // Filter by space
    if (answers.space === 'Small apartment (limited space)') {
      filtered = filtered.filter(pet => 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    } else if (answers.space === 'Medium apartment/house') {
      filtered = filtered.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    } else if (answers.space === 'Large house with yard') {
      filtered = filtered.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    } else if (answers.space === 'Rural property with outdoor space') {
      filtered = filtered.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
    }

    console.log('After space filter:', filtered);

    // Filter by preference
    if (answers.preference && answers.preference !== "I'm open to any small pet!") {
      const preference = answers.preference.toLowerCase();
      if (preference.includes('capybara')) {
        filtered = filtered.filter(pet => pet.species === 'capybara');
      } else if (preference.includes('guinea pig')) {
        filtered = filtered.filter(pet => pet.species === 'guinea_pig');
      } else if (preference.includes('hamster')) {
        filtered = filtered.filter(pet => pet.species === 'rock_cavy');
      } else if (preference.includes('rabbit')) {
        filtered = filtered.filter(pet => pet.species === 'rock_cavy');
      } else if (preference.includes('rock cavy')) {
        filtered = filtered.filter(pet => pet.species === 'rock_cavy');
      }
    }

    console.log('After preference filter:', filtered);

    // Score pets based on description/notes content
    const scoredPets = filtered.map(pet => {
      let score = 0;
      const description = (pet.description || '').toLowerCase();
      
      // High priority for pets with "recommend" in description
      if (description.includes('recommend')) {
        score += 10; // Very high priority
      }
      
      // Score based on experience level
      if (answers.experience === 'Beginner (first time with small pets)') {
        if (description.includes('gentle') || description.includes('calm') || description.includes('easy') || 
            description.includes('friendly') || description.includes('patient') || description.includes('docile')) {
          score += 3;
        }
        if (description.includes('independent') || description.includes('low maintenance')) {
          score += 2;
        }
      } else if (answers.experience === 'Intermediate (had guinea pigs/rock cavies before)') {
        if (description.includes('social') || description.includes('playful') || description.includes('active')) {
          score += 2;
        }
        if (description.includes('trainable') || description.includes('intelligent')) {
          score += 1;
        }
      } else if (answers.experience === 'Expert (experienced with various small animals)') {
        if (description.includes('challenging') || description.includes('energetic') || description.includes('special needs')) {
          score += 2;
        }
        if (description.includes('unique') || description.includes('rare')) {
          score += 1;
        }
      }

      // Score based on lifestyle/time commitment
      if (answers.lifestyle === 'Very busy (1-2 hours max)') {
        if (description.includes('independent') || description.includes('low maintenance') || 
            description.includes('quiet') || description.includes('calm')) {
          score += 3;
        }
        if (description.includes('nocturnal')) {
          score += 1;
        }
      } else if (answers.lifestyle === 'Moderate (2-4 hours)') {
        if (description.includes('social') || description.includes('playful') || description.includes('active')) {
          score += 2;
        }
      } else if (answers.lifestyle === 'Flexible (4+ hours)' || answers.lifestyle === 'Lots of time (work from home/student)') {
        if (description.includes('high energy') || description.includes('needs attention') || 
            description.includes('social') || description.includes('playful')) {
          score += 2;
        }
      }

      // Score based on space requirements
      if (answers.space === 'Small apartment (limited space)') {
        if (description.includes('small') || description.includes('compact') || description.includes('indoor')) {
          score += 2;
        }
        if (description.includes('quiet') || description.includes('low noise')) {
          score += 1;
        }
      } else if (answers.space === 'Large house with yard' || answers.space === 'Rural property with outdoor space') {
        if (description.includes('outdoor') || description.includes('large') || description.includes('active')) {
          score += 2;
        }
        if (description.includes('needs space') || description.includes('energetic')) {
          score += 1;
        }
      }

      // Score based on pet preference
      if (answers.preference) {
        const preference = answers.preference.toLowerCase();
        if (preference.includes('capybara') && description.includes('social') && description.includes('large')) {
          score += 3;
        } else if (preference.includes('guinea pig') && description.includes('vocal') && description.includes('social')) {
          score += 3;
        } else if (preference.includes('hamster') && description.includes('independent') && description.includes('nocturnal')) {
          score += 3;
        } else if (preference.includes('rabbit') && description.includes('quiet') && description.includes('trainable')) {
          score += 3;
        } else if (preference.includes('rock cavy') && description.includes('independent') && description.includes('active')) {
          score += 3;
        }
      }

      return { ...pet, score };
    });

    console.log('Scored pets:', scoredPets);

    // Sort by score (highest first) and take top 3
    const sortedPets = scoredPets.sort((a, b) => b.score - a.score);

    console.log('Sorted pets:', sortedPets);

    // Always ensure we have at least 3 recommendations
    // If no pets match criteria, return all available small pets
    if (sortedPets.length === 0) {
      const allSmallPets = availablePets.filter(pet => 
        pet.species === 'capybara' || 
        pet.species === 'guinea_pig' || 
        pet.species === 'rock_cavy'
      );
      console.log('Fallback - all small pets:', allSmallPets);
      return allSmallPets.slice(0, 3);
    }

    // If we have fewer than 3 matches, add more small pets to reach 3
    if (sortedPets.length < 3) {
      const additionalPets = availablePets.filter(pet => 
        (pet.species === 'capybara' || 
         pet.species === 'guinea_pig' || 
         pet.species === 'rock_cavy') &&
        !sortedPets.some(f => f.id === pet.id)
      );
      
      // Prioritize pets with "recommend" in description
      const recommendedPets = additionalPets.filter(pet => 
        (pet.description || '').toLowerCase().includes('recommend')
      );
      const otherPets = additionalPets.filter(pet => 
        !(pet.description || '').toLowerCase().includes('recommend')
      );
      
      // Add recommended pets first, then others
      const additionalScoredPets = [
        ...recommendedPets.map(pet => ({ ...pet, score: 5 })), // High score for recommended pets
        ...otherPets.map(pet => ({ ...pet, score: 0 }))
      ];
      
      sortedPets.push(...additionalScoredPets.slice(0, 3 - sortedPets.length));
    }

    const finalRecommendations = sortedPets.slice(0, 3);
    console.log('Final recommendations:', finalRecommendations);
    return finalRecommendations;
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setRecommendations([]);
    setShowRecommendations(false);
  };

  const handleAdoptPet = (pet: Pet) => {
    // Navigate to pet details or application page
    window.location.href = `/pets/${pet.id}`;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {/* <BotIcon /> */}
          </Avatar>
          <Box>
            <Typography variant="h5" component="h2">
              Pet Adoption Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered pet recommendations
            </Typography>
          </Box>
        </Box>

        {/* Chat Messages */}
        <Box sx={{ height: 400, overflowY: 'auto', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.isBot ? 'flex-start' : 'flex-end',
                mb: 2
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: message.isBot ? 'white' : 'primary.main',
                  color: message.isBot ? 'text.primary' : 'white',
                  boxShadow: 1
                }}
              >
                <Typography variant="body1">{message.text}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          ))}
          
          {isTyping && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Assistant is typing...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Question Options */}
        {currentQuestionIndex < questions.length && !isTyping && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Choose an option:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {questions[currentQuestionIndex].options?.map((option, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  fullWidth
                  onClick={() => handleAnswer(option)}
                  sx={{ 
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    p: 2,
                    height: 'auto',
                    whiteSpace: 'normal'
                  }}
                >
                  {option}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* Reset Button */}
        {messages.length > 0 && (
          <Button
            variant="text"
            onClick={resetChat}
            sx={{ mt: 2 }}
          >
            Start Over
          </Button>
        )}
      </Paper>

      {/* Recommendations Dialog */}
      {/* <Dialog 
        open={showRecommendations} 
        onClose={() => setShowRecommendations(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FavoriteIcon sx={{ mr: 1, color: 'primary.main' }} />
            Your Perfect Small Pet Matches
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Based on your preferences and the pets' personalities, here are some small pets that would be perfect for you:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recommendations.map((pet) => (
              <Card key={pet.id} sx={{ height: '100%' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={pet.imageUrl || '/default-pet.jpg'}
                  alt={pet.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" component="h3">
                    {pet.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {pet.breed || pet.species} • {pet.age} years old • {pet.size}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {pet.description}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleAdoptPet(pet)}
                    startIcon={<PetsIcon />}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecommendations(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={resetChat}
            startIcon={<HomeIcon />}
          >
            Start New Search
          </Button>
        </DialogActions>
      </Dialog> */}
    </Box>
  );
};

export default PetRecommendationBot; 