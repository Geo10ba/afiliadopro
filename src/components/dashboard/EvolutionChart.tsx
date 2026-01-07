import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import './EvolutionChart.css';

const EvolutionChart: React.FC = () => {
    const [data, setData] = useState<{ name: string; value: number }[]>([]);
    const [filter, setFilter] = useState('30_days');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check role
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            const isAdmin = profile?.role === 'admin';

            // Check for impersonation
            const impersonatedId = localStorage.getItem('impersonatedUserId');
            const effectiveUserId = (isAdmin && impersonatedId) ? impersonatedId : user.id;
            const isImpersonating = !!(isAdmin && impersonatedId);

            let dataToProcess = [];

            if (isAdmin && !isImpersonating) {
                // Admin sees all SALES (orders)
                let query = supabase
                    .from('orders')
                    .select('created_at, amount, status, payment_method')
                    .in('status', ['approved', 'paid', 'shipped', 'delivered']);

                // Apply date filter
                const startDate = getStartDate(filter);
                query = query.gte('created_at', startDate.toISOString());

                const { data: orders, error } = await query;
                if (error) throw error;
                dataToProcess = orders || [];
            } else {
                // Affiliate (or Admin impersonating) sees their COMMISSIONS
                let query = supabase
                    .from('commissions')
                    .select('created_at, amount, status')
                    .eq('affiliate_id', effectiveUserId); // Use effective ID

                // Apply date filter
                const startDate = getStartDate(filter);
                query = query.gte('created_at', startDate.toISOString());

                const { data: commissions, error } = await query;
                if (error) throw error;
                dataToProcess = commissions || [];
            }

            processData(dataToProcess, filter, isAdmin && !isImpersonating);

        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStartDate = (filterType: string) => {
        const now = new Date();
        const startDate = new Date();
        if (filterType === '30_days') {
            startDate.setDate(now.getDate() - 30);
        } else if (filterType === '7_days') {
            startDate.setDate(now.getDate() - 7);
        } else if (filterType === '12_months') {
            startDate.setMonth(now.getMonth() - 11);
            startDate.setDate(1);
        }
        return startDate;
    };

    const processData = (items: any[], currentFilter: string, isAdmin: boolean) => {
        const groupedData: { [key: string]: number } = {};

        // Initialize keys
        const now = new Date();
        if (currentFilter === '30_days' || currentFilter === '7_days') {
            const days = currentFilter === '30_days' ? 30 : 7;
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                groupedData[key] = 0;
            }
        } else if (currentFilter === '12_months') {
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(now.getMonth() - i);
                const key = d.toLocaleDateString('pt-BR', { month: 'short' });
                groupedData[key] = 0;
            }
        }

        items.forEach(item => {
            // For Admin (Orders): Check status 'paid' or 'shipped'/'delivered' if 'now'
            // For Affiliate (Commissions): Check status 'pending', 'available', 'paid' (usually all valid commissions count towards "earnings" even if pending, or maybe just available?)
            // Let's count all non-cancelled commissions for the chart to show potential earnings too.

            let isValid = false;
            if (isAdmin) {
                isValid = item.status === 'paid' ||
                    (item.payment_method === 'now' && ['shipped', 'delivered'].includes(item.status));
            } else {
                // For commissions, count everything except cancelled
                isValid = item.status !== 'cancelled';
            }

            if (isValid) {
                const date = new Date(item.created_at);
                let key = '';

                if (currentFilter === '12_months') {
                    key = date.toLocaleDateString('pt-BR', { month: 'short' });
                } else {
                    key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                }

                if (groupedData[key] !== undefined) {
                    groupedData[key] += Number(item.amount);
                }
            }
        });

        const chartData = Object.keys(groupedData).map(key => ({
            name: key,
            value: groupedData[key]
        }));

        setData(chartData);
    };

    return (
        <div className="card-premium evolution-chart-container">
            <div className="chart-header">
                <h2 className="text-gold">Evolução de Vendas</h2>
                <select
                    className="chart-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="7_days">Últimos 7 dias</option>
                    <option value="30_days">Últimos 30 dias</option>
                    <option value="12_months">Últimos 12 meses</option>
                </select>
            </div>

            <div className="chart-wrapper">
                {loading ? (
                    <div className="loading-state">Carregando dados...</div>
                ) : data.length === 0 || data.every(d => d.value === 0) ? (
                    <div className="empty-chart-state">
                        <p>Nenhuma venda registrada neste período.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#666"
                                tick={{ fill: '#666', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#666"
                                tick={{ fill: '#666', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#FFD700' }}
                                formatter={(value: number | undefined) => [value ? `R$ ${value.toFixed(2)}` : 'R$ 0.00', 'Vendas']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#FFD700"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default EvolutionChart;
