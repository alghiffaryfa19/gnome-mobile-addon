const { GObject, St, Clutter } = imports.gi;
const Main = imports.ui.main;
const { Extension } = imports.misc.extensionUtils;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

const ControlsState = {
    HIDDEN: 0,
    WINDOW_PICKER: 1,
    APP_GRID: 2,
};

const DASH_MAX_HEIGHT_RATIO = 0.3; // Misalkan ini rasio default untuk dash height

var GnomeMobileAddonsExtension = GObject.registerClass(
    class GnomeMobileAddonsExtension extends Extension {
        enable() {
            this._settings = this.getSettings();
            this._settings.connect('changed::dash-enabled', () => {
                Main.overview.viewSelector._computeWorkspacesBoxForState = this._computeWorkspacesBoxForState.bind(Main.overview.viewSelector);
                Main.overview.viewSelector.vfunc_allocate = this.vfunc_allocate.bind(Main.overview.viewSelector);
                Main.overview.viewSelector.queue_relayout();
            });
        }

        disable() {
            this._settings = null;
        }

        getSettings() {
            return new Gio.Settings({ schema_id: 'org.gnome.shell.extensions.gnomemobileaddons' });
        }

        _computeWorkspacesBoxForState(state, box, searchHeight, dashHeight, thumbnailsHeight) {
            const workspaceBox = box.copy();
            const [width, height] = workspaceBox.get_size();
            const { y1: startY } = this._workAreaBox;
            const expandFraction = this._workspacesThumbnails.visible ? this._workspacesThumbnails.expandFraction : 0;

            const dashEnabled = this._settings.get_boolean('dash-enabled');

            switch (state) {
                case ControlsState.HIDDEN:
                    workspaceBox.set_origin(...this._workAreaBox.get_origin());
                    workspaceBox.set_size(...this._workAreaBox.get_size());
                    break;
                case ControlsState.WINDOW_PICKER:
                    workspaceBox.set_origin(0,
                        startY + searchHeight + this._spacing +
                        thumbnailsHeight + this._spacing * expandFraction);
                    workspaceBox.set_size(width,
                        height -
                        (dashEnabled ? (dashHeight - this._spacing) : 0) -
                        searchHeight - this._spacing -
                        thumbnailsHeight - this._spacing * expandFraction);
                    break;
                case ControlsState.APP_GRID:
                    workspaceBox.set_origin(0, startY + searchHeight + this._spacing);
                    workspaceBox.set_size(width, Math.round(height * 0.7)); // SMALL_WORKSPACE_RATIO = 0.7
                    break;
            }

            return workspaceBox;
        }

        vfunc_allocate(container, box) {
            const childBox = new Clutter.ActorBox();

            const startY = this._workAreaBox.y1;
            box.y1 += startY;
            const [width, height] = box.get_size();
            let availableHeight = height;

            // Search entry
            let [searchHeight] = this._searchEntry.get_preferred_height(width);
            childBox.set_origin(0, startY);
            childBox.set_size(width, searchHeight);
            this._searchEntry.allocate(childBox);

            availableHeight -= searchHeight + this._spacing;

            // Dash
            const dashEnabled = this._settings.get_boolean('dash-enabled');

            if (dashEnabled) {
                const maxDashHeight = Math.round(box.get_height() * DASH_MAX_HEIGHT_RATIO);
                this._dash.setMaxSize(width, maxDashHeight);

                let [, dashHeight] = this._dash.get_preferred_height(width);
                dashHeight = Math.min(dashHeight, maxDashHeight);
                childBox.set_origin(0, startY + height - dashHeight);
                childBox.set_size(width, dashHeight);
                this._dash.allocate(childBox);

                availableHeight -= dashHeight + this._spacing;
            }
        }
    }
);
