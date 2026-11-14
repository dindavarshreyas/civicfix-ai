import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../shared/Badge';
import { Users, ExternalLink } from 'lucide-react';

const createPriorityPin = (priority = 'medium') => {
  const color = {
    critical: '#dc2626', // Red
    high: '#ea580c',     // Orange
    medium: '#d97706',   // Amber
    low: '#10b981',      // Emerald
  }[priority] || '#0f766e';

  return L.divIcon({
    className: 'custom-issue-pin',
    html: `
      <div style="background-color:${color};width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;border:2.5px solid white;box-shadow:0 4px 6px -1px rgba(0,0,0,0.35);">
        <div style="width:7px;height:7px;border-radius:50%;background:white;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
};

export function IssueMap({ issues = [], center = [12.9716, 77.5946], zoom = 13 }) {
  return (
    <div className="w-full h-[650px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={createPriorityPin(issue.priority)}
          >
            <Popup className="custom-issue-popup">
              <div className="p-1 min-w-[220px]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-bold text-teal-700">
                    {issue.reference_no}
                  </span>
                  <StatusBadge status={issue.status} />
                </div>

                <h4 className="text-xs font-bold text-slate-900 mb-1 line-clamp-1">
                  {issue.title}
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                  {issue.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                  <PriorityBadge priority={issue.priority} score={issue.priority_score} />
                  {issue.report_count > 1 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                      <Users className="w-3 h-3" /> {issue.report_count} reports
                    </span>
                  )}
                </div>

                <Link
                  to={`/issues/${issue.id}`}
                  className="mt-3 flex items-center justify-center gap-1 w-full text-center py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  View Details <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
