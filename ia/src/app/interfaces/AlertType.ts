export interface AlertType {
    type: 'error' | 'success' | 'warning',
    message: string,
    title: string,
}