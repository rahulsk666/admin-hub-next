export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  is_active: boolean;
  created_at: string;
  image_url: string;
}

export const vehicleTypes = [
  "Sedan",
  "SUV",
  "Truck",
  "Van",
  "Ford Transit",
  "Pickup",
  "Bus",
  "Motorcycle",
  "Other",
];
