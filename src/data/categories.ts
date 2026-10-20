import { CivicCategory, CivicCategoryType } from '../types';

export const CIVIC_CATEGORIES: CivicCategory[] = [
  {
    id: 'road_pothole',
    label: 'Road & Pothole',
    icon: '🚧',
    color: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderLight: 'border-amber-200 dark:border-amber-800/60',
    typicalDepartment: 'Public Works Department (PWD)',
    defaultSlaHours: 72,
    description: 'Crater potholes, caved-in bitumen, broken road dividers, and missing manhole covers.',
  },
  {
    id: 'garbage_waste',
    label: 'Garbage & Waste',
    icon: '🗑️',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderLight: 'border-emerald-200 dark:border-emerald-800/60',
    typicalDepartment: 'Municipal Solid Waste Management Dept',
    defaultSlaHours: 48,
    description: 'Overflowing dumpsters, illegal vacant plot dumping, biomedical waste, and uncollected trash.',
  },
  {
    id: 'streetlight',
    label: 'Streetlight & Power',
    icon: '💡',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgLight: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderLight: 'border-yellow-200 dark:border-yellow-800/60',
    typicalDepartment: 'City Electricity Distribution & Lighting Board',
    defaultSlaHours: 48,
    description: 'Non-functional streetlights, open hanging electrical wires, and damaged pole junction boxes.',
  },
  {
    id: 'water_drainage',
    label: 'Water & Drainage',
    icon: '💧',
    color: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderLight: 'border-blue-200 dark:border-blue-800/60',
    typicalDepartment: 'Delhi Jal Board / City Water & Sewerage Division',
    defaultSlaHours: 24,
    description: 'Burst pipelines, contaminated tap water, blocked stormwater drains, and street waterlogging.',
  },
  {
    id: 'traffic_parking',
    label: 'Traffic & Parking',
    icon: '🚦',
    color: 'text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    borderLight: 'border-rose-200 dark:border-rose-800/60',
    typicalDepartment: 'Traffic Police & Urban Mobility Directorate',
    defaultSlaHours: 24,
    description: 'Defective traffic signals, illegal pavement parking, blind spots, and obstructed zebra crossings.',
  },
  {
    id: 'public_infrastructure',
    label: 'Public Infrastructure',
    icon: '🏛️',
    color: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderLight: 'border-purple-200 dark:border-purple-800/60',
    typicalDepartment: 'Municipal Corporation Engineering Wing',
    defaultSlaHours: 168,
    description: 'Damaged footpaths, broken pedestrian overbridges, unsafe boundary walls, and derelict bus stops.',
  },
  {
    id: 'sanitation',
    label: 'Sanitation & Hygiene',
    icon: '✨',
    color: 'text-teal-600 dark:text-teal-400',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    borderLight: 'border-teal-200 dark:border-teal-800/60',
    typicalDepartment: 'Public Health & Sanitation Directorate',
    defaultSlaHours: 36,
    description: 'Unsanitary public toilets, open defecation spots, stagnation causing mosquito breeding, and foul odor.',
  },
];

export const getCategoryById = (id: CivicCategoryType): CivicCategory => {
  return (
    CIVIC_CATEGORIES.find((c) => c.id === id) || CIVIC_CATEGORIES[0]
  );
};
