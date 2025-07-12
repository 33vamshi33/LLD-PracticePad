import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

interface ProblemLevel {
  id: string;
  problem_id: string;
  level_number: number;
  level_description: string;
  evaluation_criteria: any;
}

const sampleProblemsWithLevels = [
  {
    title: "Library Management System",
    description: "Design a system to manage books, members, and the book lending process in a library.",
    difficulty: "Medium",
    levels: [
      {
        level_number: 1,
        level_description: "Basic entities: Book, Member, Loan with simple relationships",
        evaluation_criteria: {
          required_entities: ["Book", "Member", "Loan"],
          required_relationships: ["Member borrows Book", "Loan connects Book and Member"],
          required_attributes: ["Book: title, author, ISBN", "Member: name, id", "Loan: due_date, loan_date"]
        }
      },
      {
        level_number: 2,
        level_description: "Add multiple library branches and branch management",
        evaluation_criteria: {
          required_entities: ["Book", "Member", "Loan", "Branch"],
          required_relationships: ["Book belongs to Branch", "Member registered at Branch"],
          required_attributes: ["Branch: name, address", "Book: branch_id"]
        }
      },
      {
        level_number: 3,
        level_description: "Add user authentication and role-based access",
        evaluation_criteria: {
          required_entities: ["Book", "Member", "Loan", "Branch", "User", "Role"],
          required_relationships: ["User has Role", "Member has User account"],
          required_attributes: ["User: username, password", "Role: name, permissions"]
        }
      },
      {
        level_number: 4,
        level_description: "Handle high load with caching and performance optimization",
        evaluation_criteria: {
          required_entities: ["Book", "Member", "Loan", "Branch", "User", "Role", "Cache"],
          required_relationships: ["Cache stores frequently accessed data"],
          required_attributes: ["Cache: key, value, expiry", "Performance monitoring"]
        }
      },
      {
        level_number: 5,
        level_description: "Add concurrency control and transaction management",
        evaluation_criteria: {
          required_entities: ["Book", "Member", "Loan", "Branch", "User", "Role", "Cache", "Transaction"],
          required_relationships: ["Transaction manages multiple operations"],
          required_attributes: ["Transaction: id, status, lock_mechanism"]
        }
      }
    ]
  },
  {
    title: "Coffee Vending Machine",
    description: "Design a coffee vending machine that can make different types of coffee drinks and handle payments.",
    difficulty: "Easy",
    levels: [
      {
        level_number: 1,
        level_description: "Basic coffee types and payment handling",
        evaluation_criteria: {
          required_entities: ["Coffee", "Payment", "VendingMachine"],
          required_relationships: ["VendingMachine dispenses Coffee", "Payment processes transaction"],
          required_attributes: ["Coffee: type, price", "Payment: amount, method"]
        }
      },
      {
        level_number: 2,
        level_description: "Add inventory management and ingredient tracking",
        evaluation_criteria: {
          required_entities: ["Coffee", "Payment", "VendingMachine", "Ingredient", "Inventory"],
          required_relationships: ["Coffee uses Ingredients", "Inventory tracks Ingredient levels"],
          required_attributes: ["Ingredient: name, quantity", "Inventory: threshold, alert"]
        }
      },
      {
        level_number: 3,
        level_description: "Add user preferences and customization options",
        evaluation_criteria: {
          required_entities: ["Coffee", "Payment", "VendingMachine", "Ingredient", "Inventory", "User", "Preference"],
          required_relationships: ["User has Preferences", "Coffee customized based on Preference"],
          required_attributes: ["Preference: sugar_level, milk_type", "User: id, preferences"]
        }
      }
    ]
  },
  {
    title: "Ride-Sharing Service",
    description: "Design the core components of a ride-sharing service like Uber/Lyft.",
    difficulty: "Hard",
    levels: [
      {
        level_number: 1,
        level_description: "Basic ride booking and driver assignment",
        evaluation_criteria: {
          required_entities: ["User", "Driver", "Ride", "Location"],
          required_relationships: ["User books Ride", "Driver assigned to Ride", "Ride has pickup and dropoff"],
          required_attributes: ["Ride: status, fare", "Location: latitude, longitude"]
        }
      },
      {
        level_number: 2,
        level_description: "Add payment processing and fare calculation",
        evaluation_criteria: {
          required_entities: ["User", "Driver", "Ride", "Location", "Payment", "FareCalculator"],
          required_relationships: ["Payment processes Ride fare", "FareCalculator calculates based on distance/time"],
          required_attributes: ["Payment: amount, status", "FareCalculator: base_rate, multiplier"]
        }
      },
      {
        level_number: 3,
        level_description: "Add real-time tracking and driver availability",
        evaluation_criteria: {
          required_entities: ["User", "Driver", "Ride", "Location", "Payment", "FareCalculator", "Tracking"],
          required_relationships: ["Tracking monitors Driver location", "Driver availability affects assignment"],
          required_attributes: ["Tracking: real_time_location", "Driver: availability_status"]
        }
      },
      {
        level_number: 4,
        level_description: "Add surge pricing and demand management",
        evaluation_criteria: {
          required_entities: ["User", "Driver", "Ride", "Location", "Payment", "FareCalculator", "Tracking", "SurgePricing"],
          required_relationships: ["SurgePricing adjusts fare based on demand", "Demand affects driver assignment"],
          required_attributes: ["SurgePricing: multiplier, area", "Demand: zone, time_period"]
        }
      },
      {
        level_number: 5,
        level_description: "Add safety features and emergency handling",
        evaluation_criteria: {
          required_entities: ["User", "Driver", "Ride", "Location", "Payment", "FareCalculator", "Tracking", "SurgePricing", "Safety"],
          required_relationships: ["Safety monitors ride", "Emergency system handles incidents"],
          required_attributes: ["Safety: emergency_button, sos", "Emergency: incident_type, response"]
        }
      }
    ]
  },
  {
    title: "Parking Lot System",
    description: "Design a parking lot system that can manage multiple levels, different vehicle types, and payments.",
    difficulty: "Medium",
    levels: [
      {
        level_number: 1,
        level_description: "Basic parking spot management and vehicle entry/exit",
        evaluation_criteria: {
          required_entities: ["ParkingSpot", "Vehicle", "ParkingLot"],
          required_relationships: ["Vehicle parks in ParkingSpot", "ParkingLot contains ParkingSpots"],
          required_attributes: ["ParkingSpot: status, spot_number", "Vehicle: license_plate, entry_time"]
        }
      },
      {
        level_number: 2,
        level_description: "Add multiple levels and different vehicle types",
        evaluation_criteria: {
          required_entities: ["ParkingSpot", "Vehicle", "ParkingLot", "Level", "VehicleType"],
          required_relationships: ["Level contains ParkingSpots", "Vehicle has VehicleType"],
          required_attributes: ["Level: level_number, capacity", "VehicleType: size, rate"]
        }
      },
      {
        level_number: 3,
        level_description: "Add payment processing and time-based pricing",
        evaluation_criteria: {
          required_entities: ["ParkingSpot", "Vehicle", "ParkingLot", "Level", "VehicleType", "Payment", "Pricing"],
          required_relationships: ["Payment calculates based on time", "Pricing varies by time/type"],
          required_attributes: ["Payment: amount, duration", "Pricing: hourly_rate, daily_rate"]
        }
      },
      {
        level_number: 4,
        level_description: "Add reservation system and premium parking",
        evaluation_criteria: {
          required_entities: ["ParkingSpot", "Vehicle", "ParkingLot", "Level", "VehicleType", "Payment", "Pricing", "Reservation"],
          required_relationships: ["Reservation reserves ParkingSpot", "Premium spots have higher rates"],
          required_attributes: ["Reservation: start_time, end_time", "Premium: spot_type, additional_cost"]
        }
      }
    ]
  },
  {
    title: "Hotel Booking System",
    description: "Design a system for managing hotel room bookings, check-ins, and check-outs.",
    difficulty: "Medium",
    levels: [
      {
        level_number: 1,
        level_description: "Basic room booking and guest management",
        evaluation_criteria: {
          required_entities: ["Room", "Guest", "Booking"],
          required_relationships: ["Guest books Room", "Booking manages Room availability"],
          required_attributes: ["Room: number, type, price", "Guest: name, contact", "Booking: check_in, check_out"]
        }
      },
      {
        level_number: 2,
        level_description: "Add room types, amenities, and pricing tiers",
        evaluation_criteria: {
          required_entities: ["Room", "Guest", "Booking", "RoomType", "Amenity"],
          required_relationships: ["Room has RoomType", "RoomType includes Amenities"],
          required_attributes: ["RoomType: name, base_price", "Amenity: name, cost"]
        }
      },
      {
        level_number: 3,
        level_description: "Add check-in/check-out process and room service",
        evaluation_criteria: {
          required_entities: ["Room", "Guest", "Booking", "RoomType", "Amenity", "CheckIn", "RoomService"],
          required_relationships: ["CheckIn processes Guest arrival", "RoomService serves Room"],
          required_attributes: ["CheckIn: time, staff", "RoomService: order_type, delivery_time"]
        }
      },
      {
        level_number: 4,
        level_description: "Add loyalty program and special offers",
        evaluation_criteria: {
          required_entities: ["Room", "Guest", "Booking", "RoomType", "Amenity", "CheckIn", "RoomService", "LoyaltyProgram"],
          required_relationships: ["Guest enrolled in LoyaltyProgram", "LoyaltyProgram provides discounts"],
          required_attributes: ["LoyaltyProgram: points, tier", "SpecialOffer: discount_percentage, conditions"]
        }
      }
    ]
  }
];

const AdminPage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: '',
    description: '',
    difficulty: 'Easy'
  });
  const [newLevel, setNewLevel] = useState({
    problem_id: '',
    level_number: 1,
    level_description: '',
    evaluation_criteria: {}
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('title');

    if (error) {
      console.error('Error fetching problems:', error);
    } else {
      setProblems(data || []);
    }
  };

  const insertSampleProblems = async () => {
    setLoading(true);
    try {
      let addedProblems = 0;
      let addedLevels = 0;

      for (const problemData of sampleProblemsWithLevels) {
        // Check if problem already exists
        const { data: existingProblem } = await supabase
          .from('problems')
          .select('id, title')
          .eq('title', problemData.title)
          .single();

        let problemId;
        if (existingProblem) {
          // Problem exists, use existing ID
          problemId = existingProblem.id;
          console.log(`Problem "${problemData.title}" already exists, skipping...`);
        } else {
          // Insert new problem
          const { data: problem, error: problemError } = await supabase
            .from('problems')
            .insert([{
              title: problemData.title,
              description: problemData.description,
              difficulty: problemData.difficulty
            }])
            .select()
            .single();

          if (problemError) {
            console.error('Error inserting problem:', problemError);
            continue;
          }
          problemId = problem.id;
          addedProblems++;
        }

        // Insert levels for this problem (only if they don't exist)
        for (const levelData of problemData.levels) {
          // Check if level already exists
          const { data: existingLevel } = await supabase
            .from('problem_levels')
            .select('id')
            .eq('problem_id', problemId)
            .eq('level_number', levelData.level_number)
            .single();

          if (!existingLevel) {
            const { error: levelError } = await supabase
              .from('problem_levels')
              .insert([{
                problem_id: problemId,
                level_number: levelData.level_number,
                level_description: levelData.level_description,
                evaluation_criteria: levelData.evaluation_criteria
              }]);

            if (levelError) {
              console.error('Error inserting level:', levelError);
            } else {
              addedLevels++;
            }
          } else {
            console.log(`Level ${levelData.level_number} for "${problemData.title}" already exists, skipping...`);
          }
        }
      }
      
      alert(`Smart insertion complete!\nAdded ${addedProblems} new problems\nAdded ${addedLevels} new levels\nExisting problems and levels were skipped.`);
      fetchProblems();
    } catch (error) {
      console.error('Error inserting sample data:', error);
      alert('Failed to insert sample data');
    } finally {
      setLoading(false);
    }
  };

  const addProblem = async () => {
    if (!newProblem.title || !newProblem.description) {
      alert('Please fill in all fields');
      return;
    }

    const { error } = await supabase
      .from('problems')
      .insert([newProblem]);

    if (error) {
      console.error('Error adding problem:', error);
      alert('Failed to add problem: ' + error.message);
    } else {
      alert('Problem added successfully!');
      setNewProblem({ title: '', description: '', difficulty: 'Easy' });
      fetchProblems();
    }
  };

  const addLevel = async () => {
    if (!newLevel.problem_id || !newLevel.level_description) {
      alert('Please fill in all fields');
      return;
    }

    const { error } = await supabase
      .from('problem_levels')
      .insert([newLevel]);

    if (error) {
      console.error('Error adding level:', error);
      alert('Failed to add level: ' + error.message);
    } else {
      alert('Level added successfully!');
      setNewLevel({
        problem_id: '',
        level_number: 1,
        level_description: '',
        evaluation_criteria: {}
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Sample Data Section */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Data</h2>
        <p className="text-gray-600 mb-4">
          Insert comprehensive sample problems with multiple levels for testing.
        </p>
        <button
          onClick={insertSampleProblems}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Inserting...' : 'Insert Sample Problems & Levels'}
        </button>
      </div>

      {/* Add Problem Section */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Problem</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={newProblem.title}
              onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
              className="input-field w-full"
              placeholder="Problem title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={newProblem.difficulty}
              onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
              className="input-field w-full"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={newProblem.description}
            onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
            className="input-field w-full"
            rows={3}
            placeholder="Problem description"
          />
        </div>
        <button onClick={addProblem} className="btn-primary">
          Add Problem
        </button>
      </div>

      {/* Add Level Section */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Problem</label>
            <select
              value={newLevel.problem_id}
              onChange={(e) => setNewLevel({ ...newLevel, problem_id: e.target.value })}
              className="input-field w-full"
            >
              <option value="">Select a problem</option>
              {problems.map(problem => (
                <option key={problem.id} value={problem.id}>{problem.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level Number</label>
            <input
              type="number"
              value={newLevel.level_number}
              onChange={(e) => setNewLevel({ ...newLevel, level_number: parseInt(e.target.value) })}
              className="input-field w-full"
              min="1"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Level Description</label>
          <textarea
            value={newLevel.level_description}
            onChange={(e) => setNewLevel({ ...newLevel, level_description: e.target.value })}
            className="input-field w-full"
            rows={3}
            placeholder="Level description and requirements"
          />
        </div>
        <button onClick={addLevel} className="btn-primary">
          Add Level
        </button>
      </div>

      {/* Current Problems List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Problems</h2>
        <div className="space-y-4">
          {problems.map(problem => (
            <div key={problem.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{problem.title}</h3>
                  <p className="text-sm text-gray-600">{problem.description}</p>
                  <span className={`badge ${
                    problem.difficulty === 'Easy' ? 'badge-success' :
                    problem.difficulty === 'Medium' ? 'badge-warning' : 'badge-error'
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
