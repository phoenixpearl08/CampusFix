import React from 'react';
import { MapPin, Navigation, Building2, Layers, Home } from 'lucide-react';

const CAMPUS_DATA = {
  'Engineering Complex': {
    blocks: ['Block A', 'Block B', 'Block C'],
    floors: ['Ground Floor', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'],
    coords: '37.7749,-122.4194'
  },
  'Science & Technology Building': {
    blocks: ['Block S1', 'Block S2'],
    floors: ['Ground Floor', 'Floor 1', 'Floor 2', 'Floor 3'],
    coords: '37.7758,-122.4178'
  },
  'Central Academic Block': {
    blocks: ['Block CAB', 'North Wing', 'South Wing'],
    floors: ['Ground Floor', 'Floor 1', 'Floor 2'],
    coords: '37.7765,-122.4162'
  },
  'Main Student Library': {
    blocks: ['East Wing', 'West Wing', 'Central Atrium'],
    floors: ['Ground Floor', 'Floor 1', 'Floor 2', 'Floor 3'],
    coords: '37.7770,-122.4150'
  },
  'Sports & Student Activity Hub': {
    blocks: ['Indoor Arena', 'Outdoor Courts', 'Gymnasium Block'],
    floors: ['Ground Floor', 'Floor 1'],
    coords: '37.7735,-122.4205'
  },
  'Student Residences (Hostels)': {
    blocks: ['Hostel Block 1', 'Hostel Block 2', 'Hostel Block 3', 'Dining Hall Block'],
    floors: ['Ground Floor', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'],
    coords: '37.7720,-122.4220'
  }
};

export default function CampusLocationSelector({ value, onChange }) {
  const selectedBuilding = value.building || '';
  const currentBuildingData = CAMPUS_DATA[selectedBuilding] || null;

  const handleBuildingChange = (e) => {
    const building = e.target.value;
    const bData = CAMPUS_DATA[building];
    onChange({
      ...value,
      building,
      block: bData ? bData.blocks[0] : '',
      floor: bData ? bData.floors[0] : '',
      mapCoordinates: bData ? bData.coords : ''
    });
  };

  const handleFieldChange = (field, val) => {
    onChange({
      ...value,
      [field]: val
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-[#121219]/70 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <MapPin className="h-5 w-5 text-pink-500" />
        <h3 className="text-sm font-semibold text-white">Campus Location Details</h3>
        <span className="text-xs text-zinc-400 ml-auto">No GPS required</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Building */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-pink-400" />
            Campus Building <span className="text-pink-500">*</span>
          </label>
          <select
            id="campus-building-select"
            name="building"
            value={value.building || ''}
            onChange={handleBuildingChange}
            required
            className="w-full rounded-lg border border-zinc-700 bg-[#161622] px-3 py-2 text-sm text-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
          >
            <option value="" disabled>Select campus facility</option>
            {Object.keys(CAMPUS_DATA).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Block */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            Block / Wing <span className="text-pink-500">*</span>
          </label>
          <select
            id="campus-block-select"
            name="block"
            value={value.block || ''}
            onChange={(e) => handleFieldChange('block', e.target.value)}
            required
            disabled={!currentBuildingData}
            className="w-full rounded-lg border border-zinc-700 bg-[#161622] px-3 py-2 text-sm text-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:opacity-50 transition-colors"
          >
            <option value="" disabled>Select block</option>
            {currentBuildingData?.blocks.map((bl) => (
              <option key={bl} value={bl}>{bl}</option>
            ))}
          </select>
        </div>

        {/* Floor */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-pink-400" />
            Floor Level <span className="text-pink-500">*</span>
          </label>
          <select
            id="campus-floor-select"
            name="floor"
            value={value.floor || ''}
            onChange={(e) => handleFieldChange('floor', e.target.value)}
            required
            disabled={!currentBuildingData}
            className="w-full rounded-lg border border-zinc-700 bg-[#161622] px-3 py-2 text-sm text-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:opacity-50 transition-colors"
          >
            <option value="" disabled>Select floor</option>
            {currentBuildingData?.floors.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Room / Spot */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-pink-400" />
            Room / Spot Description
          </label>
          <input
            type="text"
            id="campus-room-input"
            name="room"
            value={value.room || ''}
            onChange={(e) => handleFieldChange('room', e.target.value)}
            placeholder="e.g. Lab 210, Washroom 204, Stall 3"
            className="w-full rounded-lg border border-zinc-700 bg-[#161622] px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
          />
        </div>
      </div>

      {value.building && (
        <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            Pinpoint: <strong className="text-zinc-200">{value.building}</strong> {value.block && `› ${value.block}`} {value.floor && `› ${value.floor}`} {value.room && `› ${value.room}`}
          </span>
          {value.mapCoordinates && (
            <span className="text-[11px] text-zinc-500 font-mono">
              GPS Grid: {value.mapCoordinates}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
