import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, TrendingUp, Package, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EvolutionChart from '../../components/dashboard/EvolutionChart';
import { Skeleton } from '../../components/ui/Skeleton';
import './AdminDashboard.css';

interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    activeAffiliates: number;
    averageTicket: number;
}

interface TopItem {
    id: string;
    name: string;
    value: number;
    subValue?: string;
}

interface OrderData {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    user_id: string;
    created_at: string;
    products: { name: string } | null;
    profiles: { full_name: string; email: string } | null;
}

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        totalOrders: 0,
        activeAffiliates: 0,
        averageTicket: 0
    });
    const [topProducts, setTopProducts] = useState<TopItem[]>([]);
    const [topAffiliates, setTopAffiliates] = useState<TopItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch orders for stats
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select(`
                    id,
                    amount,
                    status,
                    payment_method,
                    user_id,
                    created_at,
                    products:product_id (name),
                    profiles:user_id (full_name, email)
                `)
                .in('status', ['pending', 'approved', 'paid', 'shipped', 'delivered']);

            // Fetch total affiliates count
            const { count: affiliatesCount, error: affiliatesError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true }); // Head true means we only want the count, not data

            if (ordersError) throw ordersError;
            if (affiliatesError) console.error('Error fetching affiliates count:', affiliatesError);

            if (ordersError) throw ordersError;

            if (orders) {
                const typedOrders = orders as unknown as OrderData[];

                // Calculate Stats
                // Revenue: 
                // - 'paid' status (implies money received)
                // - 'shipped'/'delivered' IF payment_method is 'now' (implies it was paid before shipping)
                // - 'approved' IF payment_method is 'now' (some flows might skip 'paid' status? assuming 'approved' for 'now' means paid? No, usually 'pending' -> 'paid'. But let's stick to strict 'paid' or 'now'+shipped/delivered)
                // Actually, based on AdminOrdersPage, 'now' orders go pending -> paid. 'invoice' go pending -> approved.
                // So for 'now': paid, shipped, delivered are all valid revenue states.
                // For 'invoice': only 'paid' (if that state is reachable) would be revenue. 'approved', 'shipped', 'delivered' are debt.

                const revenueOrders = typedOrders.filter(o =>
                    o.status === 'paid' ||
                    (o.payment_method === 'now' && ['shipped', 'delivered'].includes(o.status))
                );
                const totalRevenue = revenueOrders.reduce((sum, order) => sum + Number(order.amount), 0);

                // Total Orders: Count all non-rejected (which we filtered in query)
                const totalOrders = typedOrders.length;
                const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                // Active Affiliates (unique users with approved orders)
                // Active Affiliates (unique users with approved orders) - OLD LOGIC
                // const uniqueAffiliates = new Set(typedOrders.map(o => o.user_id));
                // const activeAffiliates = uniqueAffiliates.size;

                // NEW LOGIC: Total registered profiles
                const activeAffiliates = affiliatesCount || 0;

                setStats({
                    totalRevenue,
                    totalOrders,
                    activeAffiliates,
                    averageTicket
                });

                // Calculate Top Products (based on Revenue)
                const productMap = new Map<string, { name: string, amount: number, count: number }>();
                revenueOrders.forEach(order => {
                    const productName = order.products?.name || 'Produto Desconhecido';
                    const current = productMap.get(productName) || { name: productName, amount: 0, count: 0 };
                    current.amount += Number(order.amount);
                    current.count += 1;
                    productMap.set(productName, current);
                });

                const sortedProducts = Array.from(productMap.values())
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((p, index) => ({
                        id: `prod-${index}`,
                        name: p.name,
                        value: p.amount,
                        subValue: `${p.count} vendas`
                    }));
                setTopProducts(sortedProducts);

                // Calculate Top Affiliates (based on Revenue)
                const affiliateMap = new Map<string, { name: string, amount: number, count: number }>();
                revenueOrders.forEach(order => {
                    const affiliateName = order.profiles?.full_name || order.profiles?.email || 'Usuário Desconhecido';
                    const current = affiliateMap.get(affiliateName) || { name: affiliateName, amount: 0, count: 0 };
                    current.amount += Number(order.amount);
                    current.count += 1;
                    affiliateMap.set(affiliateName, current);
                });

                const sortedAffiliates = Array.from(affiliateMap.values())
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((a, index) => ({
                        id: `aff-${index}`,
                        name: a.name,
                        value: a.amount,
                        subValue: `${a.count} pedidos`
                    }));
                setTopAffiliates(sortedAffiliates);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Administrativo</h1>
                    <p className="page-subtitle">Visão geral do desempenho da sua plataforma.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card card-premium">
                    <div className="kpi-icon revenue">
                        <DollarSign size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Faturamento Total</span>
                        {loading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <span className="kpi-value">R$ {stats.totalRevenue.toFixed(2)}</span>
                        )}
                    </div>
                </div>

                <div className="kpi-card card-premium">
                    <div className="kpi-icon orders">
                        <ShoppingCart size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total de Pedidos</span>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <span className="kpi-value">{stats.totalOrders}</span>
                        )}
                    </div>
                </div>

                <div className="kpi-card card-premium">
                    <div className="kpi-icon affiliates">
                        <Users size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Afiliados Ativos</span>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <span className="kpi-value">{stats.activeAffiliates}</span>
                        )}
                    </div>
                </div>

                <div className="kpi-card card-premium">
                    <div className="kpi-icon ticket">
                        <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Ticket Médio</span>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <span className="kpi-value">R$ {stats.averageTicket.toFixed(2)}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-charts-grid">
                {/* Evolution Chart (Reused) */}
                <div className="chart-section">
                    <EvolutionChart />
                </div>

                {/* Top Lists */}
                <div className="top-lists-column">
                    {/* Top Products */}
                    <div className="top-list-card card-premium">
                        <div className="card-header">
                            <h3><Package size={20} className="text-gold" /> Top Produtos</h3>
                        </div>
                        <div className="list-content">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : topProducts.length === 0 ? (
                                <p className="empty-text">Nenhum dado disponível.</p>
                            ) : (
                                topProducts.map((product, index) => (
                                    <div key={product.id} className="list-item">
                                        <div className="item-rank">{index + 1}</div>
                                        <div className="item-info">
                                            <span className="item-name">{product.name}</span>
                                            <span className="item-sub">{product.subValue}</span>
                                        </div>
                                        <div className="item-value">R$ {product.value.toFixed(2)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Top Affiliates */}
                    <div className="top-list-card card-premium">
                        <div className="card-header">
                            <h3><Trophy size={20} className="text-gold" /> Top Afiliados</h3>
                        </div>
                        <div className="list-content">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : topAffiliates.length === 0 ? (
                                <p className="empty-text">Nenhum dado disponível.</p>
                            ) : (
                                topAffiliates.map((affiliate, index) => (
                                    <div key={affiliate.id} className="list-item">
                                        <div className="item-rank">{index + 1}</div>
                                        <div className="item-info">
                                            <span className="item-name">{affiliate.name}</span>
                                            <span className="item-sub">{affiliate.subValue}</span>
                                        </div>
                                        <div className="item-value">R$ {affiliate.value.toFixed(2)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
