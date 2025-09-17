'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    username: string;
    avatar_url: string;
}

interface BeatmapInfo {
    id: number;
    beatmapset_id: number;
    title: string;
    artist: string;
    version: string;
    creator: string;
    star_rating: number;
    bpm: number;
    total_length: number;
    url: string;
    cover_url: string;
}

interface MapSelection {
    id: number;
    beatmapId: number;
    beatmapsetId: number;
    title: string;
    artist: string;
    version: string;
    creator: string;
    starRating: number;
    bpm: number;
    totalLength: number;
    selectedMods: string;
    comment: string;
    selectedBy: string;
    selectedAt: string;
    season: string;
    category: string;
    url: string;
}

const MOD_OPTIONS = [
    'NM', 'HD', 'HR', 'DT', 'FM', 'TB'
];

const CATEGORY_OPTIONS = [
    { value: 'qualification', label: 'Qualification' },
    { value: 'ro32', label: 'RO32' },
    { value: 'ro16', label: 'RO16' },
    { value: 'quarterfinals', label: 'Quarterfinals' },
    { value: 'semifinals', label: 'Semifinals' },
    { value: 'finals', label: 'Finals' },
    { value: 'grandfinals', label: 'Grand Finals' }
];

export default function MapSelectionPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Map selection data
    const [selections, setSelections] = useState<MapSelection[]>([]);
    const [season, setSeason] = useState('s1');
    const [category, setCategory] = useState('qualification');

    // Add selection form
    const [showAddForm, setShowAddForm] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [selectedMods, setSelectedMods] = useState('NM');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [beatmapPreview, setBeatmapPreview] = useState<BeatmapInfo | null>(null);

    // Error and message
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Check user login status and permissions
    useEffect(() => {
        checkUserAuth();
    }, []);

    // Get selection list
    useEffect(() => {
        if (isAuthorized && user) {
            fetchSelections();
        }
    }, [isAuthorized, user, season, category]);

    const checkUserAuth = async () => {
        try {
            console.log('Starting auth check...');

            // Check if user is logged in
            console.log('Fetching session...');
            const sessionResponse = await fetch('/api/session');
            console.log('Session response status:', sessionResponse.status);

            if (!sessionResponse.ok) {
                console.log('Session check failed, redirecting to register');
                setError('Not logged in. Redirecting to login page...');
                setTimeout(() => router.push('/register'), 3000); // 3秒后跳转
                return;
            }

            const sessionData = await sessionResponse.json();
            console.log('Session data:', sessionData);
            const currentUser = sessionData.user;

            if (!currentUser) {
                console.log('No user in session, redirecting to register');
                setError('No user session found. Redirecting to login page...');
                setTimeout(() => router.push('/register'), 3000); // 3秒后跳转
                return;
            }

            setUser(currentUser);
            console.log('Current user set:', currentUser);

            // Verify map selection permissions
            console.log('Checking map selection permissions for user ID:', currentUser.id);
            const authResponse = await fetch('/api/map-selection-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    osuId: currentUser.id.toString()
                })
            });

            console.log('Auth response status:', authResponse.status);
            const authError = await authResponse.json();
            console.log('Auth response data:', authError);

            if (authResponse.ok) {
                console.log('Authorization successful');
                setIsAuthorized(true);
            } else {
                console.log('Authorization failed');
                // 显示详细的调试信息
                let errorMessage = authError.error || 'You do not have permission to access the map selection system';

                if (authError.debug) {
                    errorMessage += `\n\nDebug Info:\n`;
                    errorMessage += `Your ID: ${authError.debug.yourId} (${authError.debug.yourIdType})\n`;
                    errorMessage += `Authorized IDs: ${JSON.stringify(authError.debug.authorizedIds)}\n`;
                    errorMessage += `Comparison Details:\n${JSON.stringify(authError.debug.comparisonDetails, null, 2)}`;
                }

                setError(errorMessage);
            }

        } catch (error) {
            console.error('Auth check failed:', error);
            setError(`Error verifying user permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            console.log('Auth check completed');
            setIsLoading(false);
        }
    };

    const fetchSelections = async () => {
        try {
            const response = await fetch(`/api/map-selections?season=${season}&category=${category}&osuId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setSelections(data.selections || []);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch selection list');
            }
        } catch (error) {
            console.error('Failed to fetch selections:', error);
            setError('Error fetching selection list');
        }
    };

    const parseBeatmapUrl = async () => {
        if (!urlInput.trim()) {
            setError('Please enter a beatmap URL');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setBeatmapPreview(null);

        try {
            const response = await fetch('/api/parse-beatmap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: urlInput,
                    osuId: user?.id.toString()
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data.type === 'single') {
                    setBeatmapPreview(data.data.beatmap);
                } else {
                    setBeatmapPreview(data.data.beatmaps[0]);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to parse beatmap URL');
            }
        } catch (error) {
            console.error('Failed to parse URL:', error);
            setError('Error parsing URL');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addSelection = async () => {
        if (!beatmapPreview) {
            setError('Please parse a valid beatmap URL first');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/map-selections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: urlInput,
                    selectedMods,
                    comment,
                    selectedBy: user?.id.toString(),
                    season,
                    category
                })
            });

            if (response.ok) {
                setMessage('Map selection added successfully');
                setShowAddForm(false);
                setUrlInput('');
                setComment('');
                setSelectedMods('NM');
                setBeatmapPreview(null);
                fetchSelections();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to add map selection');
            }
        } catch (error) {
            console.error('Failed to add selection:', error);
            setError('Error adding map selection');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteSelection = async (id: number) => {
        if (!confirm('Are you sure you want to delete this map selection?')) {
            return;
        }

        try {
            const response = await fetch(`/api/map-selections?id=${id}&selectedBy=${user?.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessage('Map selection deleted successfully');
                fetchSelections();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete map selection');
            }
        } catch (error) {
            console.error('Failed to delete selection:', error);
            setError('Error deleting map selection');
        }
    };

    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="text-gray-800 text-xl mb-4">Verifying permissions...</div>
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 max-w-2xl">
                            <pre className="text-gray-800 whitespace-pre-wrap text-sm">
                                {error}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-2xl">
                    <h2 className="text-gray-800 text-xl font-bold mb-4">Access Denied</h2>
                    <pre className="text-gray-800 mb-4 whitespace-pre-wrap text-sm bg-black/20 p-4 rounded overflow-auto max-h-96">
                        {error}
                    </pre>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Map Selection System</h1>
                    <div className="flex items-center space-x-4">
                        {user && (
                            <div className="flex items-center space-x-2 text-gray-800">
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full"
                                />
                                <span>{user.username}</span>
                            </div>
                        )}
                        <button
                            onClick={() => router.push('/')}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            Home
                        </button>
                    </div>
                </div>

                {/* Error and message alerts */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-gray-800">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="text-red-600 hover:text-red-800 mt-2"
                        >
                            Close
                        </button>
                    </div>
                )}

                {message && (
                    <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
                        <p className="text-gray-800">{message}</p>
                        <button
                            onClick={() => setMessage('')}
                            className="text-green-600 hover:text-green-800 mt-2"
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* Control panel */}
                <div className="bg-gray-100 rounded-lg p-6 mb-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div>
                                <label className="block text-gray-800 text-sm mb-1">Season</label>
                                <select
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value)}
                                    className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                >
                                    <option value="s1">Season 1</option>
                                    <option value="s2">Season 2</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-800 text-sm mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                >
                                    {CATEGORY_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
                        >
                            Add Map
                        </button>
                    </div>
                </div>

                {/* Add map form */}
                {showAddForm && (
                    <div className="bg-gray-100 rounded-lg p-6 mb-6">
                        <h3 className="text-gray-800 text-xl font-bold mb-4">Add New Map Selection</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-800 text-sm mb-2">Beatmap URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://osu.ppy.sh/beatmaps/123456 or https://osu.ppy.sh/beatmapsets/12345"
                                        className="flex-1 bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                    />
                                    <button
                                        onClick={parseBeatmapUrl}
                                        disabled={isSubmitting}
                                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded"
                                    >
                                        {isSubmitting ? 'Parsing...' : 'Parse'}
                                    </button>
                                </div>
                            </div>

                            {/* Beatmap preview */}
                            {beatmapPreview && (
                                <div className="bg-gray-200 rounded-lg p-4">
                                    <h4 className="text-gray-800 font-bold mb-2">Beatmap Preview</h4>
                                    <div className="text-gray-800 space-y-1">
                                        <p><strong>Title:</strong> {beatmapPreview.title}</p>
                                        <p><strong>Artist:</strong> {beatmapPreview.artist}</p>
                                        <p><strong>Difficulty:</strong> {beatmapPreview.version}</p>
                                        <p><strong>Mapper:</strong> {beatmapPreview.creator}</p>
                                        <p><strong>Star Rating:</strong> {beatmapPreview.star_rating.toFixed(2)}★</p>
                                        <p><strong>BPM:</strong> {beatmapPreview.bpm}</p>
                                        <p><strong>Length:</strong> {formatLength(beatmapPreview.total_length)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-gray-800 text-sm mb-2">Mod</label>
                                    <select
                                        value={selectedMods}
                                        onChange={(e) => setSelectedMods(e.target.value)}
                                        className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                    >
                                        {MOD_OPTIONS.map(mod => (
                                            <option key={mod} value={mod}>{mod}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-2">
                                    <label className="block text-gray-800 text-sm mb-2">Comment</label>
                                    <input
                                        type="text"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Optional comment"
                                        className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setUrlInput('');
                                        setComment('');
                                        setSelectedMods('NM');
                                        setBeatmapPreview(null);
                                        setError('');
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addSelection}
                                    disabled={!beatmapPreview || isSubmitting}
                                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-2 rounded"
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Map'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map selection list */}
                <div className="bg-gray-100 rounded-lg p-6">
                    <h3 className="text-gray-800 text-xl font-bold mb-4">
                        Selected Maps ({selections.length})
                    </h3>

                    {selections.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">No map selections</p>
                    ) : (
                        <div className="space-y-4">
                            {selections.map((selection) => (
                                <div key={selection.id} className="bg-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">
                                                    {selection.selectedMods}
                                                </span>
                                                <h4 className="text-gray-800 font-bold">
                                                    {selection.title} - {selection.artist}
                                                </h4>
                                            </div>
                                            <div className="text-gray-700 space-y-1">
                                                <p><strong>Difficulty:</strong> {selection.version}</p>
                                                <p><strong>Mapper:</strong> {selection.creator}</p>
                                                <p><strong>Star Rating:</strong> {selection.starRating.toFixed(2)}★</p>
                                                <p><strong>BPM:</strong> {selection.bpm}</p>
                                                <p><strong>Length:</strong> {formatLength(selection.totalLength)}</p>
                                                {selection.comment && (
                                                    <p><strong>Comment:</strong> {selection.comment}</p>
                                                )}
                                                <p><strong>Selected At:</strong> {new Date(selection.selectedAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <a
                                                href={selection.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                View
                                            </a>
                                            {selection.selectedBy === user?.id.toString() && (
                                                <button
                                                    onClick={() => deleteSelection(selection.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
