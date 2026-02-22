import React, { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { logsApi } from '../services/api';
import type { LogEntry } from '../types';
import { useToast } from '../hooks/useToast';

export default function Logs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { show } = useToast();

    // Filters & Pagination State
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchLogs = () => {
        setLoading(true);
        logsApi.list({
            status,
            phone: search,
            startDate,
            endDate,
            page,
            limit: 20,
            sortBy,
            sortOrder
        })
            .then(res => {
                setLogs(res.logs);
                setTotal(res.total);
                setTotalPages(res.totalPages || Math.ceil(res.total / 20));
            })
            .catch(() => show('Failed to fetch logs', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLogs();
    }, [page, status, sortBy, sortOrder]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const toggleExpand = (log: LogEntry) => {
        if (log.status !== 'failed') return;
        setExpandedId(expandedId === log.id ? null : log.id);
    };

    return (
        <AppLayout title="Delivery Logs">
            {/* Filters Bar */}
            <div className="card mb-6">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end p-1">
                    <div className="form-group mb-0 flex-1 min-w-[200px]">
                        <label className="form-label text-xs">Search Phone</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                            <input
                                className="form-input pl-9"
                                placeholder="Search by number..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group mb-0 w-[150px]">
                        <label className="form-label text-xs">Status</label>
                        <select
                            className="form-input"
                            value={status}
                            onChange={e => { setStatus(e.target.value); setPage(1); }}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                            <option value="verified">Verified</option>
                        </select>
                    </div>

                    <div className="form-group mb-0 w-[160px]">
                        <label className="form-label text-xs">From</label>
                        <input
                            type="date"
                            className="form-input"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className="form-group mb-0 w-[160px]">
                        <label className="form-label text-xs">To</label>
                        <input
                            type="date"
                            className="form-input"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1); }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-icon h-[38px]">
                        <Filter size={16} />
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}></th>
                                <th onClick={() => toggleSort('status')} className="cursor-pointer hover:text-accent">
                                    <div className="flex items-center gap-1">
                                        Status {sortBy === 'status' && <ArrowUpDown size={12} />}
                                    </div>
                                </th>
                                <th onClick={() => toggleSort('phone')} className="cursor-pointer hover:text-accent">
                                    <div className="flex items-center gap-1">
                                        Phone Number {sortBy === 'phone' && <ArrowUpDown size={12} />}
                                    </div>
                                </th>
                                <th>API Key / Source</th>
                                <th onClick={() => toggleSort('createdAt')} className="cursor-pointer hover:text-accent">
                                    <div className="flex items-center gap-1">
                                        Timestamp {sortBy === 'createdAt' && <ArrowUpDown size={12} />}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-8">Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state">No logs found</td></tr>
                            ) : (
                                logs.map(log => (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            onClick={() => toggleExpand(log)}
                                            style={{ cursor: log.status === 'failed' ? 'pointer' : 'default' }}
                                            className={expandedId === log.id ? 'bg-accent/5' : ''}
                                        >
                                            <td>
                                                {log.status === 'failed' && (
                                                    expandedId === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className={`badge ${log.status === 'delivered' || log.status === 'verified' ? 'badge-green' :
                                                        log.status === 'failed' ? 'badge-red' : 'badge-orange'
                                                        }`}>
                                                        {log.status.toUpperCase()}
                                                    </span>
                                                    {log.status === 'failed' && <AlertCircle size={14} className="text-warn" />}
                                                </div>
                                            </td>
                                            <td className="font-mono">{log.phone}</td>
                                            <td className="text-xs text-secondary">{log.apiKeyName}</td>
                                            <td className="text-xs text-secondary">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                        {expandedId === log.id && (
                                            <tr className="bg-accent/5 animate-in">
                                                <td></td>
                                                <td colSpan={4} className="p-4 pt-0">
                                                    <div className="bg-warn/10 border border-warn/20 rounded-lg p-3 text-sm flex gap-3 items-start">
                                                        <AlertCircle size={16} className="text-warn shrink-0 mt-0.5" />
                                                        <div>
                                                            <div className="font-semibold text-primary mb-1">Failure Reason:</div>
                                                            <div className="text-secondary font-mono text-xs">
                                                                {log.failReason || 'Unknown error occurred during delivery'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && logs.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
                        <div className="text-xs text-secondary">
                            Showing page {page} of {totalPages} ({total} total logs)
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-icon btn-secondary btn-sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className="btn btn-icon btn-secondary btn-sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
